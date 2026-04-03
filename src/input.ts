import * as core from "@actions/core";

/**
 * Read an input and parse it as JSON. Returns the parsed value.
 * Throws if the input is missing (when required) or not valid JSON.
 */
export function parseJsonInput<T = unknown>(
  name: string,
  options?: { required?: boolean },
): T | undefined {
  const raw = core.getInput(name, options);
  if (!raw) return undefined;
  return JSON.parse(raw) as T;
}

/**
 * Read a required input. Throws if missing.
 */
export function requireInput(name: string): string {
  return core.getInput(name, { required: true });
}

/**
 * Read an optional input. Returns undefined if empty.
 */
export function getOptionalInput(name: string): string | undefined {
  return core.getInput(name) || undefined;
}
