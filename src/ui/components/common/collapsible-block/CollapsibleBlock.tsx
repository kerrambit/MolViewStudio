/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState, type ReactNode } from "react";
import { Collapse } from "@mantine/core";
import { CollapseTrigger } from "../collapse-trigger/CollapseTriger";

type CollapsibleBlockProps = {
    /**
     * Title shown in the trigger.
     */
    title: string;

    /**
     * Size of the title text.
     */
    titleTextSize?: "lg" | "xs" | "sm" | "md" | "xl";

    /**
     * Optional icon rendered before the title, e.g. `<IconHelpCircle size={18} />`.
     */
    icon?: ReactNode;

    /**
     * Controlled expanded state. When provided, the parent owns the state and must update it in `onExpandedChange`.
     */
    expanded?: boolean;

    /**
     * Called with the new expanded state whenever the user toggles the block.
     */
    onExpandedChange?: (expanded: boolean) => void;

    /**
     * Initial expanded state when the block is not controlled. Defaults to `false`.
     */
    defaultExpanded?: boolean;

    /**
     * Maximum height of the content, longer content scrolls. Defaults to `16em`.
     */
    maxContentHeight?: string;

    /**
     * Content shown when the block is expanded.
     */
    children: ReactNode;
};

/**
 * Block with a clickable title (and optional icon) which shows or hides its scrollable content.
 * Works controlled (`expanded` + `onExpandedChange`) or uncontrolled (keeps its own state).
 */
export function CollapsibleBlock({
    title,
    titleTextSize,
    icon,
    expanded,
    onExpandedChange,
    defaultExpanded = false,
    maxContentHeight = "16em",
    children,
}: CollapsibleBlockProps) {
    const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

    // The parent owns the state when `expanded` is provided.
    const isControlled = expanded !== undefined;
    const isExpanded = isControlled ? expanded : internalExpanded;

    const handleToggle = () => {
        const next = !isExpanded;
        if (!isControlled) {
            setInternalExpanded(next);
        }
        onExpandedChange?.(next);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <CollapseTrigger
                title={title}
                titleTextSize={titleTextSize}
                icon={icon}
                expanded={isExpanded}
                onClick={handleToggle}
            />
            <Collapse expanded={isExpanded}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75em",
                        maxHeight: maxContentHeight,
                        overflowY: "auto",
                        paddingTop: "0.5em",
                        paddingRight: "0.5em",
                        wordBreak: "break-word",
                    }}
                >
                    {children}
                </div>
            </Collapse>
        </div>
    );
}
