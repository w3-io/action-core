/**
 * Test utilities for W3 actions.
 *
 * Mocks @actions/core so you can test command handlers in isolation
 * without running the full GitHub Actions runtime.
 */
let _inputs = {};
let _outputs = new Map();
let _failed = null;
export function mockAction(inputs) {
    _inputs = inputs;
    _outputs = new Map();
    _failed = null;
    for (const [key, value] of Object.entries(inputs)) {
        const envKey = `INPUT_${key.replace(/-/g, "_").toUpperCase()}`;
        process.env[envKey] = value;
    }
}
export function getOutput(name) {
    return _outputs.get(name);
}
export function expectOutput(name, validator) {
    const value = _outputs.get(name);
    if (value === undefined) {
        throw new Error(`Expected output "${name}" to be set. Got: ${JSON.stringify(Object.fromEntries(_outputs))}`);
    }
    if (validator && !validator(value)) {
        throw new Error(`Output "${name}" failed validation. Value: ${value}`);
    }
}
export function expectFailed(pattern) {
    if (_failed === null) {
        throw new Error("Expected action to fail, but it succeeded");
    }
    if (pattern) {
        const matches = typeof pattern === "string"
            ? _failed.includes(pattern)
            : pattern.test(_failed);
        if (!matches) {
            throw new Error(`Expected failure matching "${pattern}", got: "${_failed}"`);
        }
    }
}
export function expectSuccess() {
    if (_failed !== null) {
        throw new Error(`Expected action to succeed, but it failed: "${_failed}"`);
    }
}
export function cleanupMock() {
    for (const key of Object.keys(process.env)) {
        if (key.startsWith("INPUT_")) {
            delete process.env[key];
        }
    }
    _inputs = {};
    _outputs = new Map();
    _failed = null;
}
export function createMockCore() {
    const noopChain = () => ({ addRaw: noopChain, addHeading: noopChain, addCodeBlock: noopChain, write: async () => { } });
    return {
        getInput: (name, opts) => {
            const value = _inputs[name] ?? "";
            if (opts?.required && !value) {
                throw new Error(`Input required and not supplied: ${name}`);
            }
            return value;
        },
        setOutput: (name, value) => {
            _outputs.set(name, typeof value === "string" ? value : JSON.stringify(value));
        },
        setFailed: (message) => {
            _failed = message;
        },
        info: (_msg) => { },
        warning: (_msg) => { },
        error: (_msg) => { },
        debug: (_msg) => { },
        summary: { addHeading: noopChain, addRaw: noopChain, addCodeBlock: noopChain, write: async () => { } },
    };
}
