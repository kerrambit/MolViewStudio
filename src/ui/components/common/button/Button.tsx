/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { ReactNode, TablerIcon } from "@tabler/icons-react";
import { buildCSSClassString } from "../../../utils/cssClassBuilder";

import "./Button.css";

interface ButtonProps {
    label?: string;
    disabled?: boolean;
    icon?: TablerIcon;
    tooltip?: string;
    onClick?: () => void;
    children?: ReactNode;
    variant?: "primary" | "secondary" | "ghost";
    size?: "small" | "medium" | "large";
    iconPosition?: "left" | "right";
    ariaLabel?: string;
    key?: string;
}

export function Button({
    label,
    disabled = false,
    icon,
    tooltip,
    onClick,
    children,
    variant = "primary",
    size = "medium",
    iconPosition = "left",
    ariaLabel,
    ...props
}: ButtonProps) {
    const buttonClasses = buildCSSClassString([
        "button",
        `button--${variant}`,
        `button--${size}`,
        disabled && "button--disabled",
        icon && !label && !children && "button--icon-only",
    ]);

    const renderContent = () => {
        if (children) {
            return children;
        }

        const IconComponent = icon;
        if (IconComponent && !label) {
            return <IconComponent className="button__icon" />;
        }

        if (label && !IconComponent) {
            return label;
        }

        if (IconComponent && label) {
            return iconPosition === "left" ? (
                <>
                    <IconComponent className="button__icon button__icon--left" />
                    <span className="button__label">{label}</span>
                </>
            ) : (
                <>
                    <span className="button__label">{label}</span>
                    <IconComponent className="button__icon button__icon--right" />
                </>
            );
        }

        return null;
    };

    return (
        <button
            className={buttonClasses}
            disabled={disabled}
            title={tooltip}
            onClick={onClick}
            aria-label={ariaLabel}
            {...props}
        >
            {renderContent()}
        </button>
    );
}
