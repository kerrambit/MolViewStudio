import { type CSSProperties } from "react";

interface ThumbnailProps {
    src?: Base64URLString;
    alt: string;
    title?: string;
    onClick?: () => void;
    style?: CSSProperties;
    className?: string;
}

export function Thumbnail(props: ThumbnailProps) {
    return (
        <img
            onClick={props.onClick}
            className={props.className}
            title={props.title}
            src={props.src}
            alt={props.alt}
            style={{
                // Base styles
                cursor: props.onClick ? "pointer" : "default",
                maxWidth: "90%",
                borderRadius: "6px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                ...props.style,
            }}
        />
    );
}
