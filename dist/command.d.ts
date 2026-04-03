/**
 * A command handler — an async function that performs an action operation.
 */
export type CommandHandler = () => Promise<void>;
/**
 * Create a command router that dispatches on the `command` input.
 *
 * Usage:
 *   const router = createCommandRouter({
 *     "create-payment": async () => { ... },
 *     "get-payment": async () => { ... },
 *   });
 *   router();  // reads `command` input, dispatches, handles errors
 */
export declare function createCommandRouter(commands: Record<string, CommandHandler>): () => void;
