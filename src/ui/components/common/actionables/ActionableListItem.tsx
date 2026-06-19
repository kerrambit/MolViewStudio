import type { ReactNode } from "react";

import "./ActionableListItem.css";

interface ActionableListItemProps {
    title?: string;
    children?: ReactNode;
}

/**
 * ActionableListItem represents an item component in some list, where each item has some title and possible actions atteched to it.
 */
export function ActionableListItem(props: ActionableListItemProps) {
    return (
        <div className="actionableListItem">
            <p style={{ margin: 3 }}>{props.title}</p>
            <div>{props.children}</div>
        </div>
    );
}
