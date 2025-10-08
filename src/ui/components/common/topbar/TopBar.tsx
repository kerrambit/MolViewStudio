import type { ReactNode } from "react";

import "./Topbar.css";

interface TopBarProps {
    children?: ReactNode;
    className?: string;
}

export function TopBar(props: TopBarProps) {
    return (
        <header className={`topbar ${props.className}`}>
            {props.children}
        </header>
    );
}
