/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useContext } from "react";
import { MenuContext } from "../providers/MenuContext";

export function useMenu() {
    const context = useContext(MenuContext);
    if (!context) {
        throw new Error("Menu must be used within MenuProvider");
    }
    return context;
}
