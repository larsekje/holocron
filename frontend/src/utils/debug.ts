/**
 * Debug utilities for the application
 */

// Set to true to enable verbose logging in the console
const DEBUG = true;

/**
 * Logs a message to the console if debug mode is enabled
 * @param module The module name (e.g., "EffectStore", "GameplayStore")
 * @param message The message to log
 * @param data Optional data to log
 */
export const debugLog = (module: string, message: string, data?: any) => {
  if (!DEBUG) return;
  
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `[${timestamp}][${module}]`;
  
  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
};
