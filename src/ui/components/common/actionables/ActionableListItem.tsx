import type { CSSProperties, ReactNode } from "react";
import { Text } from "@mantine/core";

import "./ActionableListItem.css";

interface ActionableListItemProps {
    title?: string;
    titleSize?: "sm" | "xs" | "md" | "lg" | "xl" | undefined;
    tooltip?: string;
    leftComponent?: ReactNode;
    rightComponent?: ReactNode;
    styles?: CSSProperties;
}

/**
 * ActionableListItem represents an item component in some list, where each item has some title and possible actions atteched to it.
 */
export function ActionableListItem(props: ActionableListItemProps) {
    return (
        <div
            className="actionableListItem actionableListItemColor"
            title={props.title}
            style={props.styles}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: "0.35em",
                        paddingRight: props.leftComponent ? "0.5em" : "0em",
                    }}
                >
                    {props.leftComponent}
                </div>
                <Text size={props.titleSize}>{props.title}</Text>
            </div>
            <div>{props.rightComponent}</div>
        </div>
    );
}
