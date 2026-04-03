/**
 * Test utilities for W3 actions.
 *
 * Mocks @actions/core so you can test command handlers in isolation
 * without running the full GitHub Actions runtime.
 */
export declare function mockAction(inputs: Record<string, string>): void;
export declare function getOutput(name: string): string | undefined;
export declare function expectOutput(name: string, validator?: (value: string) => boolean): void;
export declare function expectFailed(pattern?: string | RegExp): void;
export declare function expectSuccess(): void;
export declare function cleanupMock(): void;
export declare function createMockCore(): {
    getInput: (name: string, opts?: {
        required?: boolean;
    }) => string;
    setOutput: (name: string, value: unknown) => void;
    setFailed: (message: string) => void;
    info: (_msg: string) => void;
    warning: (_msg: string) => void;
    error: (_msg: string) => void;
    debug: (_msg: string) => void;
    summary: {
        addHeading: () => {
            addRaw: /*elided*/ any;
            addHeading: /*elided*/ any;
            addCodeBlock: /*elided*/ any;
            write: () => Promise<void>;
        };
        addRaw: () => {
            addRaw: /*elided*/ any;
            addHeading: /*elided*/ any;
            addCodeBlock: /*elided*/ any;
            write: () => Promise<void>;
        };
        addCodeBlock: () => {
            addRaw: /*elided*/ any;
            addHeading: /*elided*/ any;
            addCodeBlock: /*elided*/ any;
            write: () => Promise<void>;
        };
        write: () => Promise<void>;
    };
};
