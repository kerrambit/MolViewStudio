/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { CSSProperties, ReactNode } from "react";
import { Text } from "@mantine/core";

import "./ActionableListItem.css";

interface ActionableListItemProps {
    title?: string;
    titleSize?: "sm" | "xs" | "md" | "lg" | "xl" | undefined;
    tooltip?: string;
    leftComponent?: ReactNode;
    rightComponent?: ReactNode;
    style?: CSSProperties;
}

/**
 * ActionableListItem represents an item component in some list, where each item has some title and possible actions atteched to it.
 */
export function ActionableListItem(props: ActionableListItemProps) {
    return (
        <div
            className="actionableListItem actionableListItemColor"
            title={props.tooltip}
            style={props.style}
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
                <Text
                    size={props.titleSize}
                    truncate="end"
                    style={{ flex: 1, minWidth: 0 }}
                >
                    {props.title}
                </Text>
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "0.5em",
                }}
            >
                {props.rightComponent}
            </div>
        </div>
    );
}
