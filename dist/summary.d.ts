/**
 * Write a job summary safely.
 *
 * Wraps `@actions/core` summary with proper `await` and error handling.
 * The W3 runner sets GITHUB_STEP_SUMMARY and mounts a writable file,
 * so this works on both GitHub Actions and W3. If the summary file is
 * unavailable (local dev, CI without summary support), the write is
 * silently skipped.
 *
 * Usage:
 *   await writeSummary("My Action: deposit", [
 *     ["Amount", "1000 USDC"],
 *     ["TX", "`0xabc...`"],
 *   ]);
 *
 *   await writeSummary("My Action: query", result);
 */
export declare function writeSummary(heading: string, content: [string, string][] | Record<string, unknown> | string): Promise<void>;
