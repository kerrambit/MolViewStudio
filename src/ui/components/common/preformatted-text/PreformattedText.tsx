import type React from "react";

import "./PreformattedText.css";

type PreformattedTextProps = React.PropsWithChildren;

export function PreformattedText(props: PreformattedTextProps) {
    return <pre className="preformatted-text">{props.children}</pre>;
}
