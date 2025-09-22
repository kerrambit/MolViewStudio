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
