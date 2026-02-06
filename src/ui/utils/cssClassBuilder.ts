/**
 * Builds a CSS class string from an array of conditional values.
 * @param classes - array containing strings or falsy values (boolean, null, undefined)
 * @returns space-separated string of all truthy classes
 */
export function buildCSSClassString(
    classes: (string | boolean | null | undefined)[],
) {
    return classes.filter(Boolean).join(" ");
}
