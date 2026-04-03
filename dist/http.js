import { W3ActionError } from "./error.js";
/**
 * Make an HTTP request with JSON body. Returns parsed JSON response.
 *
 * For partner API clients that don't need the bridge.
 */
export async function request(url, options = {}) {
    const { method = "GET", headers = {}, body, timeout = 30000 } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new W3ActionError("HTTP_ERROR", `${response.status}: ${text}`, {
                statusCode: response.status,
            });
        }
        return (await response.json());
    }
    finally {
        clearTimeout(timer);
    }
}
