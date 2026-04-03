/**
 * Make an HTTP request with JSON body. Returns parsed JSON response.
 *
 * For partner API clients that don't need the bridge.
 */
export declare function request<T = unknown>(url: string, options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
}): Promise<T>;
