import React from "react";

import "./ActionableList.css";

type ActionableListProps = React.PropsWithChildren;

/**
 * `ActionableList` represents list of component items which are expected to be instances of `ActionableListItem`.
 * In general form, it is group of vertically stacked components with a small gap in-between.
 */
export function ActionableList(props: ActionableListProps) {
    return <div className="actionableList">{props.children}</div>;
}
