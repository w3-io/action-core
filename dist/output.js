import * as core from "@actions/core";
/**
 * Set a JSON output. Serializes exactly once — prevents double-encoding.
 *
 * If the value is already a string, it's set directly.
 * If it's an object/array/number/boolean, it's JSON.stringified once.
 */
export function setJsonOutput(name, value) {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    core.setOutput(name, serialized);
}
/**
 * Set multiple outputs at once.
 */
export function setOutputs(outputs) {
    for (const [key, value] of Object.entries(outputs)) {
        if (value != null) {
            setJsonOutput(key, value);
        }
    }
}
