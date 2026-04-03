import * as core from "@actions/core";
/**
 * Read an input and parse it as JSON. Returns the parsed value.
 * Throws if the input is missing (when required) or not valid JSON.
 */
export function parseJsonInput(name, options) {
    const raw = core.getInput(name, options);
    if (!raw)
        return undefined;
    return JSON.parse(raw);
}
/**
 * Read a required input. Throws if missing.
 */
export function requireInput(name) {
    return core.getInput(name, { required: true });
}
/**
 * Read an optional input. Returns undefined if empty.
 */
export function getOptionalInput(name) {
    return core.getInput(name) || undefined;
}
