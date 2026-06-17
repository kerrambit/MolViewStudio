import type { ReactNode } from "react";

import "./Footer.css";

interface FooterProps {
    children?: ReactNode;
    className?: string;
}

export function Footer(props: FooterProps) {
    return (
        <footer className={`footer ${props.className}`}>
            {props.children}
        </footer>
    );
}
