import "./ActionableListItem.css";
import type { ReactNode } from "react";

interface ActionableListItemProps {
    title?: string;
    children?: ReactNode;
}

export function ActionableListItem(props: ActionableListItemProps) {
    return (
        <div className="actionableListItem">
            <p style={{ margin: 3 }}>{props.title}</p>
            <div>{props.children}</div>
        </div>
    );
}
