/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type React from "react";

import "./PreformattedText.css";

type PreformattedTextProps = React.PropsWithChildren;

export function PreformattedText(props: PreformattedTextProps) {
    return <pre className="preformatted-text">{props.children}</pre>;
}
