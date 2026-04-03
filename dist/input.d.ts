/**
 * Read an input and parse it as JSON. Returns the parsed value.
 * Throws if the input is missing (when required) or not valid JSON.
 */
export declare function parseJsonInput<T = unknown>(name: string, options?: {
    required?: boolean;
}): T | undefined;
/**
 * Read a required input. Throws if missing.
 */
export declare function requireInput(name: string): string;
/**
 * Read an optional input. Returns undefined if empty.
 */
export declare function getOptionalInput(name: string): string | undefined;
