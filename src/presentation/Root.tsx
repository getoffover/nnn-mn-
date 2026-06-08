import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectAuditConfig, selectIsAuditEnabled, selectAuditQueue } from '../store/slices/auditSlice';
import { logAuditEvent, clearAuditQueue } from '../store/actions/auditActions';
import { AuditEvent, AuditConfig, AuditStatus, AuditError } from '../types/audit';
import { Logger } from '../utils/logger';
import { useToast } from './components/ToastContext';

// Context for audit requirements state
interface AuditRequirementsContextType {
  auditEnabled: boolean;
  config: AuditConfig | null;
  queue: AuditEvent[];
  logEvent: (event: AuditEvent) => Promise<void>;
  clearQueue: () => void;
  status: AuditStatus;
  error: AuditError | null;
}

const AuditRequirementsContext = createContext<AuditRequirementsContextType | undefined>(undefined);

/**
 * AuditRequirementsProvider - Provides audit requirements context to the application
 * Handles audit event logging, configuration, and error states
 */
export const AuditRequirementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const auditConfig = useAppSelector(selectAuditConfig);
  const isAuditEnabled = useAppSelector(selectIsAuditEnabled);
  const auditQueue = useAppSelector(selectAuditQueue);
  
  const [status, setStatus] = React.useState<AuditStatus>('idle');
  const [error, setError] = React.useState<AuditError | null>(null);
  
  const { showToast } = useToast();

  // Log audit event with error handling
  const logEvent = useCallback(async (event: AuditEvent): Promise<void> => {
    if (!isAuditEnabled) {
      Logger.warn('Audit logging is disabled. Event not queued:', event);
      return;
    }

    try {
      setStatus('pending');
      setError(null);
      
      // Validate event structure
      if (!event.type || !event.timestamp) {
        throw new Error('Invalid audit event: missing required fields (type, timestamp)');
      }

      // Dispatch to store for queueing
      await dispatch(logAuditEvent(event)).unwrap();
      setStatus('success');
      
      // Show success toast for critical events
      if (event.severity === 'critical') {
        showToast({
          type: 'success',
          message: `Audit event logged: ${event.type}`,
        });
      }
    } catch (err) {
      const auditError: AuditError = {
        type: 'log_failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred while logging audit event',
        timestamp: new Date().toISOString(),
        originalEvent: event,
      };
      
      setError(auditError);
      setStatus('error');
      
      Logger.error('Failed to log audit event:', auditError);
      showToast({
        type: 'error',
        message: `Failed to log audit event: ${auditError.message}`,
      });
    }
  }, [dispatch, isAuditEnabled, showToast]);

  // Clear audit queue
  const clearQueue = useCallback(() => {
    try {
      dispatch(clearAuditQueue());
      setStatus('idle');
      setError(null);
      showToast({
        type: 'success',
        message: 'Audit queue cleared',
      });
    } catch (err) {
      const clearError: AuditError = {
        type: 'clear_failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred while clearing audit queue',
        timestamp: new Date().toISOString(),
      };
      
      setError(clearError);
      setStatus('error');
      Logger.error('Failed to clear audit queue:', clearError);
      showToast({
        type: 'error',
        message: `Failed to clear audit queue: ${clearError.message}`,
      });
    }
  }, [dispatch, showToast]);

  // Provide context value
  const contextValue = useMemo<AuditRequirementsContextType>(() => ({
    auditEnabled: isAuditEnabled,
    config: auditConfig,
    queue: auditQueue,
    logEvent,
    clearQueue,
    status,
    error,
  }), [isAuditEnabled, auditConfig, auditQueue, logEvent, clearQueue, status, error]);

  return (
    <AuditRequirementsContext.Provider value={contextValue}>
      {children}
    </AuditRequirementsContext.Provider>
  );
};

/**
 * useAuditRequirements - Hook to access audit requirements context
 * @returns AuditRequirementsContextType - Context containing audit functionality
 */
export const useAuditRequirements = (): AuditRequirementsContextType => {
  const context = useContext(AuditRequirementsContext);
  if (context === undefined) {
    throw new Error('useAuditRequirements must be used within an AuditRequirementsProvider');
  }
  return context;
};

/**
 * AuditRequirementsValidator - Component to validate audit requirements
 * Confirms assumptions about user behavior tracking and validates acceptance criteria
 */
export const AuditRequirementsValidator: React.FC = () => {
  const { auditEnabled, config, queue, status, error } = useAuditRequirements();
  
  // Validate audit configuration on mount
  useEffect(() => {
    if (!auditEnabled) {
      Logger.warn('Audit requirements: Audit logging is disabled');
      return;
    }

    if (!config) {
      Logger.error('Audit requirements: Audit configuration is missing');
      return;
    }

    // Validate scope boundaries
    const scope = config.scope || [];
    if (scope.length === 0) {
      Logger.warn('Audit requirements: Audit scope is empty - no user actions will be audited');
    }

    // Validate acceptance criteria
    const acceptanceCriteria = config.acceptanceCriteria || [];
    if (acceptanceCriteria.length === 0) {
      Logger.warn('Audit requirements: No acceptance criteria defined');
    }

    // Log validation result
    Logger.info('Audit requirements validated successfully', {
      enabled: auditEnabled,
      scopeCount: scope.length,
      criteriaCount: acceptanceCriteria.length,
      queueLength: queue.length,
    });
  }, [auditEnabled, config, queue.length]);

  // Handle error states
  useEffect(() => {
    if (error) {
      Logger.error('Audit requirements validation failed:', error);
    }
  }, [error]);

  // Render nothing - this component is for side effects only
  return null;
};

/**
 * AuditRequirementsBoundary - Component to handle audit requirements errors gracefully
 */
export const AuditRequirementsBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { error } = useAuditRequirements();
  
  // If audit error exists, show fallback UI but don't break core functionality
  if (error) {
    return (
      <div 
        role="alert" 
        aria-live="polite"
        className="hidden" // Hidden by default to avoid UI disruption
      >
        {/* In production, this would be a non-intrusive notification */}
        <div className="sr-only">
          Audit requirements error: {error.message}
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

/**
 * Root - Main application root component with audit requirements integration
 */
export const Root: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuditRequirementsProvider>
      <AuditRequirementsValidator />
      <AuditRequirementsBoundary>
        {children}
      </AuditRequirementsBoundary>
    </AuditRequirementsProvider>
  );
};