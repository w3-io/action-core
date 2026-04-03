/**
 * Set a JSON output. Serializes exactly once — prevents double-encoding.
 *
 * If the value is already a string, it's set directly.
 * If it's an object/array/number/boolean, it's JSON.stringified once.
 */
export declare function setJsonOutput(name: string, value: unknown): void;
/**
 * Set multiple outputs at once.
 */
export declare function setOutputs(outputs: Record<string, unknown>): void;
