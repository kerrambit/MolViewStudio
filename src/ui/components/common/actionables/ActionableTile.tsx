import type { ReactNode } from "react";

import "./ActionableTile.css";

interface ActionableTileProps {
    children?: ReactNode;
}

/**
 * ActionableTile is a component which is expected to take an `ActionIcon` as its child.
 * It adds a slight background and border, encapsulating it as a button-tile component.
 */
export function ActionableTile(props: ActionableTileProps) {
    return (
        <div className="actionableTile">
            <div>{props.children}</div>
        </div>
    );
}
