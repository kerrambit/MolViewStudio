/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { murmurHash3_128_fromBytes } from "molstar/lib/mol-data/util";
import { Color } from "molstar/lib/mol-util/color";

/**
 * Converts color of type `Color` to hexadecimal format.
 * @param color color
 * @returns hexadecimal representation of `color` as string, default value is `#ffffff`,
 */
export function convertColorToHexString(color: Color | undefined): string {
    if (color === undefined) return "#ffffff";
    return Color.toHexString(color);
}

/**
 * Converts color encoded as hex string to Color type.
 * @param hexStringColor color encoded as hex string
 * @returns Color object
 */
export function convertHexStringToColor(hexStringColor: string): Color {
    return Color(Number.parseInt(hexStringColor.slice(1), 16));
}

/**
 * Converts file content into Uint8Array.
 * @param content content
 * @returns result as Uint8Array
 */
export function convertFileContentToUint8Array(
    content: string | Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
    if (typeof content === "string") {
        return new TextEncoder().encode(content) as Uint8Array<ArrayBuffer>;
    }
    return content;
}

// Session archive ID — generated once.
let sessionArchiveId: string | null = null;

/**
 * Generates session archive UD.
 * @returns
 */
export function generateArchiveID(): string {
    if (!sessionArchiveId) {
        sessionArchiveId = `ni,MurmurHash3_128;${murmurHash3_128_fromBytes(
            new TextEncoder().encode(`session-${Date.now()}`),
            42,
        )}${Date.now()}`;
    }
    return sessionArchiveId;
}

/**
 * Resets session archive ID.
 */
export function resetSessionArchiveId() {
    sessionArchiveId = null;
}

/**
 * Creates arcp URI.
 * @param archiveId id of the given archive
 * @param path path
 * @returns arcp URI
 */
export function arcpUri(archiveId: string, path: string): string {
    return new URL(path, `arcp://${archiveId}/`).href;
}

/**
 * Instance of `TextDecoder`.
 */
let _decoder: TextDecoder | undefined;

/**
 * Decode `Uint8Array` into UTF8 string;
 * @param bytes bytes to decode
 * @returns UTF8 string
 */
export function decodeUtf8(bytes: Uint8Array): string {
    _decoder ??= new TextDecoder();
    return _decoder.decode(bytes);
}
