/**
 * Retrieves and validates a specific field from a Fetch Response.
 * This function parses the response body as JSON and extracts the value associated with `key`.
 * If the value is a JSON-encoded string (e.g., coming from a Python backend), it attempts
 * to parse it into the final type `T`.
 * @param response - Fetch Response object to parse
 * @param key - property name to extract from the response body
 * @param expectedType - type expected for the raw field value, use "object" if the field is already a parsed array/object.
 * @template T - desired return type, can be a primitive, interface, or array.
 * @returns A promise resolving to the value cast as type `T`.
 * @throws If the response is malformed, the key is missing, or the type mismatch occurs, error is thrown
 * @example
 * ```ts
 * // Parsing a stringified array: {"files": "[\"path1.bin\", \"path2.bin\"]"}
 * const paths = await getFieldFromResponse<string[]>(res, "files", "string");
 * ```
 */
export async function getFieldFromResponse<T>(
    response: Response,
    key: string,
    expectedType: "string" | "number" | "boolean" | "object",
): Promise<T> {
    const responseBody = await response.json();
    const value = responseBody[key];

    if (value === undefined) {
        throw new Error(`Missing expected field <${key}> in response!`);
    }

    if (typeof value !== expectedType) {
        throw new Error(
            `Expected <${key}> to be <${expectedType}>, but received <${typeof value}>!`,
        );
    }

    try {
        return JSON.parse(value as any) as T;
    } catch {
        return value as T;
    }
}
