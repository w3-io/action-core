import * as core from "@actions/core";
/**
 * Structured error with code, message, and optional details.
 */
export class W3ActionError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, options) {
        super(message);
        this.name = "W3ActionError";
        this.code = code;
        this.statusCode = options?.statusCode;
        this.details = options?.details;
    }
}
/**
 * Top-level error handler for action entry points.
 *
 * Usage:
 *   main().catch(handleError);
 */
export function handleError(error) {
    if (error instanceof W3ActionError) {
        core.setOutput("error-code", error.code);
        if (error.statusCode)
            core.setOutput("status-code", error.statusCode);
        core.setFailed(`[${error.code}] ${error.message}`);
    }
    else if (error instanceof Error) {
        core.setFailed(error.message);
    }
    else {
        core.setFailed(String(error));
    }
}
