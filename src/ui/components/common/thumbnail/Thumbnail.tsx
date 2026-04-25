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
                paddingBottom: "1em",
                ...props.style,
            }}
        />
    );
}
