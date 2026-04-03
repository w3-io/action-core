import * as core from "@actions/core";
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
export async function writeSummary(heading, content) {
    try {
        core.summary.addHeading(heading, 3);
        if (typeof content === "string") {
            core.summary.addRaw(content);
        }
        else if (Array.isArray(content)) {
            // Key-value pairs rendered as markdown
            for (const [key, value] of content) {
                core.summary.addRaw(`**${key}:** ${value}\n\n`);
            }
        }
        else {
            core.summary.addCodeBlock(JSON.stringify(content, null, 2), "json");
        }
        await core.summary.write();
    }
    catch {
        // Silently skip — environment may not support job summaries
    }
}
