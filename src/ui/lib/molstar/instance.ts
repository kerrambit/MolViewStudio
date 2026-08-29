/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

/**
 * Instance of `PluginUIContext`.
 */
let molstarInstance: PluginUIContext | undefined;

/**
 * Retrieves current PluginUIContext (Molstar) object. Might throw exception if no instance is set (see `setMolstar` function).
 * @returns PluginUIContext (Molstar) object
 */
export function getMolstar(): PluginUIContext {
    if (!molstarInstance) throw new Error("Molstar is not initialized!");
    return molstarInstance;
}

/**
 * Retrieves current PluginUIContext (Molstar) object. Does not throw exception if no instance is set (see `setMolstar` function).
 * @returns PluginUIContext (Molstar) object  or undefined
 */
export function getMolstarDontThrow(): PluginUIContext | undefined {
    return molstarInstance;
}

/**
 * Sets the current PluginUIContext object.
 * @param plugin PluginUIContext object to set
 */
export function setMolstar(plugin: PluginUIContext | undefined) {
    molstarInstance = plugin;
}
