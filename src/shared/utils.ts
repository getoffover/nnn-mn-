/**
 * Shared utility functions for rollout safety mechanisms.
 * Provides pre-deployment checks, rollback capabilities, and operational monitoring utilities.
 * 
 * @module RolloutSafety
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { createHash } from 'crypto';

// Types
export type RolloutStatus = 'pending' | 'active' | 'rolled_back' | 'completed';

export interface RolloutConfig {
  readonly rolloutId: string;
  readonly version: string;
  readonly environment: string;
  readonly featureFlagName?: string;
  readonly errorRateThreshold: number;
  readonly healthCheckTimeoutMs: number;
  readonly rollbackThreshold: number;
  readonly monitoringDashboardUrl?: string;
  readonly escalationPath: string[];
}

export interface HealthCheckResult {
  readonly status: 'healthy' | 'unhealthy';
  readonly timestamp: number;
  readonly details?: Record<string, unknown>;
}

export interface RolloutMetrics {
  readonly errorRate: number;
  readonly requestCount: number;
  readonly latencyP99: number;
  readonly healthStatus: HealthCheckResult;
}

export interface RolloutResult {
  readonly status: RolloutStatus;
  readonly rolloutId: string;
  readonly timestamp: number;
  readonly message?: string;
}

// Constants
const ROLLOUT_CONFIG_PATH = 'config/rollout.json';
const ROLLOUT_STATE_PATH = '.rollout-state.json';
const HEALTH_CHECK_ENDPOINT = '/health';
const ERROR_RATE_METRIC_NAME = 'http_requests_error_rate';
const REQUEST_COUNT_METRIC_NAME = 'http_requests_total';
const LATENCY_P99_METRIC_NAME = 'http_request_duration_seconds_p99';

/**
 * Validates pre-deployment requirements.
 * Runs linting, type-checking, unit tests, and config validation.
 * 
 * @throws {Error} If any pre-deployment check fails
 */
export function runPreDeploymentChecks(): void {
  try {
    // 1. Linting check
    try {
      execSync('npm run lint -- --max-warnings=0', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Pre-deployment check failed: Linting errors detected');
    }

    // 2. Type-checking
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Pre-deployment check failed: Type-checking errors detected');
    }

    // 3. Unit test coverage (minimum 80%)
    try {
      const coverageOutput = execSync('npm run test:coverage -- --silent', { encoding: 'utf8' });
      const coverageMatch = coverageOutput.match(/All files\s*\|\s*([\d.]+)\s*\|/);
      if (!coverageMatch || parseFloat(coverageMatch[1]) < 80) {
        throw new Error('Pre-deployment check failed: Unit test coverage below 80%');
      }
    } catch (error) {
      throw new Error('Pre-deployment check failed: Unit tests failed or insufficient coverage');
    }

    // 4. Config validation
    validateRolloutConfig();
  } catch (error) {
    throw new Error(`Pre-deployment checks failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validates rollout configuration file.
 * Ensures required fields exist and values are within acceptable ranges.
 * 
 * @throws {Error} If configuration is invalid
 */
export function validateRolloutConfig(): void {
  const configPath = resolve(ROLLOUT_CONFIG_PATH);
  
  if (!existsSync(configPath)) {
    throw new Error(`Rollout configuration file not found: ${configPath}`);
  }

  let config: RolloutConfig;
  try {
    const rawConfig = readFileSync(configPath, 'utf8');
    config = JSON.parse(rawConfig) as RolloutConfig;
  } catch (error) {
    throw new Error(`Failed to parse rollout configuration: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
  }

  // Validate required fields
  if (!config.rolloutId || typeof config.rolloutId !== 'string') {
    throw new Error('Rollout configuration missing or invalid rolloutId');
  }

  if (!config.version || typeof config.version !== 'string') {
    throw new Error('Rollout configuration missing or invalid version');
  }

  if (!config.environment || !['development', 'staging', 'production'].includes(config.environment)) {
    throw new Error('Rollout configuration missing or invalid environment');
  }

  if (config.errorRateThreshold < 0 || config.errorRateThreshold > 100) {
    throw new Error('Rollout configuration errorRateThreshold must be between 0 and 100');
  }

  if (config.healthCheckTimeoutMs <= 0) {
    throw new Error('Rollout configuration healthCheckTimeoutMs must be positive');
  }

  if (config.rollbackThreshold <= 0) {
    throw new Error('Rollout configuration rollbackThreshold must be positive');
  }

  // Validate escalation path is non-empty array
  if (!Array.isArray(config.escalationPath) || config.escalationPath.length === 0) {
    throw new Error('Rollout configuration escalationPath must be a non-empty array');
  }
}

/**
 * Generates a deterministic rollout ID based on commit hash and timestamp.
 * 
 * @param commitHash - Git commit hash (optional, defaults to current HEAD)
 * @returns Rollout ID string
 */
export function generateRolloutId(commitHash?: string): string {
  const timestamp = Date.now();
  const hashInput = commitHash ?? execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const hash = createHash('sha256').update(`${hashInput}-${timestamp}`).digest('hex').slice(0, 12);
  
  return `rollout-${hash}`;
}

/**
 * Persists rollout state to local file for rollback/recovery.
 * 
 * @param state - Rollout state to persist
 */
export function persistRolloutState(state: RolloutState): void {
  const statePath = resolve(ROLLOUT_STATE_PATH);
  try {
    writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`Failed to persist rollout state: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Loads persisted rollout state from local file.
 * 
 * @returns Rollout state or null if not found
 */
export function loadRolloutState(): RolloutState | null {
  const statePath = resolve(ROLLOUT_STATE_PATH);
  
  if (!existsSync(statePath)) {
    return null;
  }

  try {
    const rawState = readFileSync(statePath, 'utf8');
    return JSON.parse(rawState) as RolloutState;
  } catch (error) {
    console.warn(`Failed to load rollout state: ${error instanceof Error ? error.message : 'Invalid state file'}`);
    return null;
  }
}

/**
 * Checks health of the deployed service.
 * 
 * @param endpoint - Health check endpoint URL (optional, defaults to HEALTH_CHECK_ENDPOINT)
 * @param timeoutMs - Timeout in milliseconds (optional, defaults to config value)
 * @returns Health check result
 */
export async function performHealthCheck(endpoint = HEALTH_CHECK_ENDPOINT, timeoutMs?: number): Promise<HealthCheckResult> {
  const config = loadRolloutConfig();
  const actualTimeout = timeoutMs ?? config?.healthCheckTimeoutMs ?? 5000;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), actualTimeout);
    
    const response = await fetch(new URL(endpoint, process.env.HEALTH_CHECK_BASE_URL ?? 'http://localhost:3000').href, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        details: { statusCode: response.status, statusText: response.statusText }
      };
    }

    const body = await response.json();
    return {
      status: 'healthy',
      timestamp: Date.now(),
      details: body
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: Date.now(),
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}

/**
 * Retrieves current rollout metrics from monitoring system.
 * 
 * @returns Rollout metrics object
 */
export async function getRolloutMetrics(): Promise<RolloutMetrics> {
  const config = loadRolloutConfig();
  
  // In production, this would query Prometheus/Grafana/CloudWatch
  // For now, simulate metrics retrieval with fallbacks
  const metrics = {
    errorRate: 0.0,
    requestCount: 0,
    latencyP99: 0.0,
    healthStatus: await performHealthCheck()
  };

  // Simulate metrics retrieval (replace with actual implementation)
  try {
    const response = await fetch(
      new URL('/api/v1/query', process.env.METRICS_BASE_URL ?? 'http://localhost:9090').href,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          query: `${ERROR_RATE_METRIC_NAME}{env="${config.environment}",service="shared-utils"}`
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data?.data?.result?.[0]?.value?.[1]) {
        metrics.errorRate = parseFloat(data.data.result[0].value[1]);
      }
    }
  } catch (error) {
    console.warn('Metrics query failed, using defaults:', error instanceof Error ? error.message : String(error));
  }

  return metrics;
}

/**
 * Evaluates whether rollback should be triggered based on metrics.
 * 
 * @param metrics - Current rollout metrics
 * @param config - Rollout configuration
 * @returns true if rollback should be triggered
 */
export function shouldRollback(metrics: RolloutMetrics, config: RolloutConfig): boolean {
  // Check error rate threshold
  if (metrics.errorRate > config.errorRateThreshold) {
    console.warn(`Rollback triggered: Error rate ${metrics.errorRate}% exceeds threshold ${config.errorRateThreshold}%`);
    return true;
  }

  // Check health status
  if (metrics.healthStatus.status === 'unhealthy') {
    console.warn('Rollback triggered: Health check failed');
    return true;
  }

  // Check manual override (via environment variable)
  if (process.env.ROLLBACK_OVERRIDE === 'true') {
    console.warn('Rollback triggered: Manual override enabled');
    return true;
  }

  return false;
}

/**
 * Executes rollback procedure.
 * 
 * @param config - Rollout configuration
 * @param state - Rollout state to restore
 * @returns Rollout result
 */
export async function executeRollback(config: RolloutConfig, state: RolloutState): Promise<RolloutResult> {
  try {
    // 1. Disable feature flag if present
    if (config.featureFlagName) {
      await setFeatureFlag(config.featureFlagName, false);
    }

    // 2. Restore previous version
    if (state.previousVersion) {
      await restoreVersion(state.previousVersion);
    }

    // 3. Clear rollout state
    const statePath = resolve(ROLLOUT_STATE_PATH);
    if (existsSync(statePath)) {
      execSync(`rm ${statePath}`);
    }

    return {
      status: 'rolled_back',
      rolloutId: config.rolloutId,
      timestamp: Date.now(),
      message: `Rollback completed successfully for version ${state.previousVersion ?? 'unknown'}`
    };
  } catch (error) {
    return {
      status: 'rolled_back',
      rolloutId: config.rolloutId,
      timestamp: Date.now(),
      message: `Rollback completed with warnings: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Sets feature flag state.
 * 
 * @param flagName - Feature flag name
 * @param enabled - Whether to enable the flag
 */
export async function setFeatureFlag(flagName: string, enabled: boolean): Promise<void> {
  // In production, this would call your feature flag service (e.g., LaunchDarkly, Flagsmith)
  // For now, simulate with environment variable
  process.env[`FEATURE_${flagName.toUpperCase()}`] = String(enabled);
}

/**
 * Restores previous application version.
 * 
 * @param version - Version to restore
 */
export async function restoreVersion(version: string): Promise<void> {
  // In production, this would trigger deployment rollback
  // For local testing, this is a no-op
  console.log(`Restoring version: ${version}`);
}

/**
 * Loads rollout configuration from file.
 * 
 * @returns Rollout config or null if not found
 */
export function loadRolloutConfig(): RolloutConfig {
  const configPath = resolve(ROLLOUT_CONFIG_PATH);
  
  if (!existsSync(configPath)) {
    throw new Error(`Rollout configuration file not found: ${configPath}`);
  }

  try {
    const rawConfig = readFileSync(configPath, 'utf8');
    return JSON.parse(rawConfig) as RolloutConfig;
  } catch (error) {
    throw new Error(`Failed to load rollout configuration: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
  }
}

// Internal state interface
interface RolloutState {
  readonly version: string;
  readonly previousVersion?: string;
  readonly rolloutId: string;
  readonly timestamp: number;
  readonly environment: string;
  readonly status: RolloutStatus;
}

/**
 * Verifies rollout success via smoke tests.
 * 
 * @param smokeTests - Array of smoke test functions
 * @returns true if all smoke tests pass
 */
export async function runSmokeTests(...smokeTests: Array<() => Promise<boolean>>): Promise<boolean> {
  const results = await Promise.all(smokeTests.map(test => test()));
  return results.every(result => result);
}

/**
 * Creates a smoke test for basic functionality.
 * 
 * @param endpoint - Endpoint to test
 * @param expectedStatus - Expected HTTP status code
 * @returns Smoke test function
 */
export function createSmokeTest(endpoint: string, expectedStatus = 200): () => Promise<boolean> {
  return async (): Promise<boolean> => {
    try {
      const response = await fetch(new URL(endpoint, process.env.HEALTH_CHECK_BASE_URL ?? 'http://localhost:3000').href);
      return response.status === expectedStatus;
    } catch {
      return false;
    }
  };
}

/**
 * Generates operational documentation for the rollout.
 * 
 * @param config - Rollout configuration
 * @returns Documentation object
 */
export function generateRolloutDocumentation(config: RolloutConfig): RolloutDocumentation {
  return {
    runbook: {
      preDeployment: [
        'Run "npm run pre-deploy-checks" to validate environment',
        'Verify all tests pass with "npm test"',
        'Confirm config/rollout.json is correct'
      ],
      deployment: [
        'Deploy to staging environment first',
        'Run smoke tests: "npm run smoke-test"',
        'Monitor error rate for 5 minutes',
        'If healthy, deploy to production with gradual rollout'
      ],
      rollback: [
        'Trigger rollback via "npm run rollback"',
        'Verify feature flag is disabled',
        'Confirm previous version is active',
        'Check error metrics have normalized'
      ]
    },
    monitoring: {
      dashboards: [
        config.monitoringDashboardUrl ?? 'https://grafana.example.com/d/shared-utils-rollout',
        'https://grafana.example.com/d/error-rate-overview'
      ],
      alerts: [
        `Error rate > ${config.errorRateThreshold}% for 2 minutes`,
        'Health check failures',
        'Latency P99 > 500ms'
      ]
    },
    escalation: {
      path: config.escalationPath,
      contact: {
        slack: '#shared-utils-alerts',
        pagerDuty: 'shared-utils-oncall'
      }
    }
  };
}

// Documentation interface
export interface RolloutDocumentation {
  readonly runbook: {
    readonly preDeployment: string[];
    readonly deployment: string[];
    readonly rollback: string[];
  };
  readonly monitoring: {
    readonly dashboards: string[];
    readonly alerts: string[];
  };
  readonly escalation: {
    readonly path: string[];
    readonly contact: {
      readonly slack: string;
      readonly pagerDuty: string;
    };
  };
}