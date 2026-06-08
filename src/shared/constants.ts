/**
 * @fileoverview Centralized constants for the application.
 * 
 * This module provides type-safe, environment-aware constants used across the application.
 * Constants are grouped by domain (e.g., API, UI, FEATURE_FLAGS) and support environment-specific overrides.
 * 
 * @module
 */

import { isString, isNumber, isBoolean, isObject, isNil } from 'lodash-es';

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Environment type definition.
 * @readonly
 * @enum {string}
 */
export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

/**
 * Current runtime environment.
 * @type {Environment}
 * @throws {Error} If `process.env.NODE_ENV` is not one of the defined environments.
 */
export const ENVIRONMENT: Environment = (() => {
  const rawEnv = process?.env?.NODE_ENV ?? 'development';
  if (rawEnv === Environment.Development || rawEnv === Environment.Staging || rawEnv === Environment.Production) {
    return rawEnv;
  }
  throw new Error(`Invalid NODE_ENV: "${rawEnv}". Must be one of: ${Object.values(Environment).join(', ')}`);
})();

// ============================================================================
// Base Constants Interface & Validation Utilities
// ============================================================================

/**
 * Base interface for all constant definitions.
 * @template T - The expected value type.
 */
export interface ConstantDefinition<T> {
  /** Default value (used when no environment override is provided). */
  defaultValue: T;
  /** Optional environment-specific overrides. */
  overrides?: Partial<Record<Environment, T>>;
  /** Optional validation function. */
  validator?: (value: T) => boolean;
  /** Human-readable description for documentation purposes. */
  description?: string;
}

/**
 * Validates a constant value against its definition.
 * @template T - The expected value type.
 * @param {ConstantDefinition<T>} def - The constant definition.
 * @param {T} value - The value to validate.
 * @returns {void}
 * @throws {Error} If validation fails.
 */
function validateConstant<T>(def: ConstantDefinition<T>, value: T): void {
  if (def.validator && !def.validator(value)) {
    throw new Error(`Validation failed for constant: ${def.description ?? 'unknown'}. Value: ${String(value)}`);
  }
}

/**
 * Resolves the effective constant value, applying environment-specific overrides.
 * @template T - The expected value type.
 * @param {ConstantDefinition<T>} def - The constant definition.
 * @returns {T} - The resolved value.
 * @throws {Error} If the resolved value fails validation.
 */
function resolveConstant<T>(def: ConstantDefinition<T>): T {
  const baseValue = def.defaultValue;
  const envOverride = def.overrides?.[ENVIRONMENT];

  const effectiveValue = envOverride !== undefined ? envOverride : baseValue;

  validateConstant(def, effectiveValue);

  return effectiveValue;
}

// ============================================================================
// Type-Safe Constant Accessors
// ============================================================================

/**
 * Creates a type-safe constant accessor with environment override support.
 * @template T - The expected value type.
 * @param {ConstantDefinition<T>} def - The constant definition.
 * @returns {T} - The resolved constant value.
 */
export function defineConstant<T>(def: ConstantDefinition<T>): T {
  return resolveConstant(def);
}

/**
 * Creates a string constant.
 * @param {string} defaultValue - Default value.
 * @param {Partial<Record<Environment, string>>} [overrides] - Environment-specific overrides.
 * @param {string} [description] - Human-readable description.
 * @returns {string}
 */
export function defineStringConstant(
  defaultValue: string,
  overrides?: Partial<Record<Environment, string>>,
  description?: string
): string {
  return defineConstant({
    defaultValue,
    overrides,
    validator: (val): val is string => isString(val),
    description,
  });
}

/**
 * Creates a number constant.
 * @param {number} defaultValue - Default value.
 * @param {Partial<Record<Environment, number>>} [overrides] - Environment-specific overrides.
 * @param {string} [description] - Human-readable description.
 * @returns {number}
 */
export function defineNumberConstant(
  defaultValue: number,
  overrides?: Partial<Record<Environment, number>>,
  description?: string
): number {
  return defineConstant({
    defaultValue,
    overrides,
    validator: (val): val is number => isNumber(val),
    description,
  });
}

/**
 * Creates a boolean constant.
 * @param {boolean} defaultValue - Default value.
 * @param {Partial<Record<Environment, boolean>>} [overrides] - Environment-specific overrides.
 * @param {string} [description] - Human-readable description.
 * @returns {boolean}
 */
export function defineBooleanConstant(
  defaultValue: boolean,
  overrides?: Partial<Record<Environment, boolean>>,
  description?: string
): boolean {
  return defineConstant({
    defaultValue,
    overrides,
    validator: (val): val is boolean => isBoolean(val),
    description,
  });
}

/**
 * Creates an object constant (shallow validation only).
 * @template T - Object type.
 * @param {T} defaultValue - Default value.
 * @param {Partial<Record<Environment, T>>} [overrides] - Environment-specific overrides.
 * @param {string} [description] - Human-readable description.
 * @returns {T}
 */
export function defineObjectConstant<T extends object>(
  defaultValue: T,
  overrides?: Partial<Record<Environment, T>>,
  description?: string
): T {
  return defineConstant({
    defaultValue,
    overrides,
    validator: (val): val is T => isObject(val) && !isNil(val),
    description,
  });
}

// ============================================================================
// Application Constants
// ============================================================================

/**
 * API configuration constants.
 */
export const API = {
  /**
   * Base URL for API requests.
   * @type {string}
   */
  BASE_URL: defineStringConstant(
    'http://localhost:3000/api',
    {
      production: 'https://api.example.com/v1',
      staging: 'https://staging-api.example.com/v1',
    },
    'Base URL for API endpoints'
  ),

  /**
   * Default timeout for API requests in milliseconds.
   * @type {number}
   */
  TIMEOUT_MS: defineNumberConstant(
    10_000,
    {
      production: 15_000,
    },
    'Default timeout for API requests'
  ),
};

/**
 * UI configuration constants.
 */
export const UI = {
  /**
   * Maximum number of items to display in paginated lists.
   * @type {number}
   */
  DEFAULT_PAGE_SIZE: defineNumberConstant(
    20,
    {
      development: 5,
    },
    'Default page size for list pagination'
  ),

  /**
   * Whether to enable debug UI overlays.
   * @type {boolean}
   */
  DEBUG_OVERLAYS: defineBooleanConstant(
    ENVIRONMENT === Environment.Development,
    undefined,
    'Enable debug UI overlays (e.g., performance metrics)'
  ),
};

/**
 * Feature flags.
 */
export const FEATURE_FLAGS = {
  /**
   * Enables the new dashboard UI.
   * @type {boolean}
   */
  NEW_DASHBOARD: defineBooleanConstant(
    false,
    {
      development: true,
      staging: true,
    },
    'Enable the new dashboard UI'
  ),
};

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Returns the current environment.
 * @returns {Environment}
 */
export function getEnvironment(): Environment {
  return ENVIRONMENT;
}

/**
 * Returns all defined constant keys for documentation or introspection.
 * @returns {string[]} - Array of constant group and key paths (e.g., `['API.BASE_URL', 'UI.DEBUG_OVERLAYS']`).
 */
export function getConstantKeys(): string[] {
  // Note: This is a manual list for introspection. Auto-generate if scale demands it.
  return [
    'API.BASE_URL',
    'API.TIMEOUT_MS',
    'UI.DEFAULT_PAGE_SIZE',
    'UI.DEBUG_OVERLAYS',
    'FEATURE_FLAGS.NEW_DASHBOARD',
  ];
}

// ============================================================================
// Runtime Safety & Validation
// ============================================================================

/**
 * Validates all constants at startup.
 * Throws on any validation failure.
 * @throws {Error} If any constant fails validation.
 */
export function validateAllConstants(): void {
  // Force evaluation of all constants to trigger validation
  void API.BASE_URL;
  void API.TIMEOUT_MS;
  void UI.DEFAULT_PAGE_SIZE;
  void UI.DEBUG_OVERLAYS;
  void FEATURE_FLAGS.NEW_DASHBOARD;
}

// Initialize validation on module load in non-test environments
if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'test') {
  validateAllConstants();
}
```