/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { CSSProperties, ReactNode } from "react";

import "./Sidebar.css";

interface SideBarProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export function Sidebar(props: SideBarProps) {
    return (
        <div style={props.style} className={`sidebar ${props.className}`}>
            {props.children}
        </div>
    );
}
