/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import React, { useEffect, useState, type CSSProperties } from "react";

import "./UnstyledTextInput.css";

/**
 * Properties for UnstyledTextInput.
 */
interface UnstyledTextInputProps {
    /**
     * Optional text rendered before the input value.
     */
    prefix?: string;

    /**
     * Controlled value of the input.
     * When provided, the component operates in controlled mode and
     * the value is fully driven by the parent component.
     */
    value?: string;

    /**
     * Initial value of the input when used in uncontrolled mode.
     * This value is only applied on the initial render.
     */
    defaultValue?: string;

    /**
     * Maximum allowed length of the input value. Additional characters are truncated. Default is `80`.
     */
    maxLength?: number;

    /**
     * Optional flag indicating if the value in controlled mode can be empty string. Default is 'false'.
     */
    canBeEmpty?: boolean;

    /**
     * Placeholder text shown when the input is empty.
     */
    placeholder?: string;

    /**
     * Optional tooltip text displayed on hover.
     */
    tooltip?: string;

    /**
     * Whether the input is enabled. When false, the input is disabled and cannot be edited. Default is `true`.
     */
    enabled?: boolean;

    /**
     * Whether the input field text should be in bold. Default is `false`.
     */
    bold?: boolean;

    /**
     * Whether the input field text should have background to differentiate from other UI components. Default is `false`.
     */
    permanentInputFieldBackground?: boolean;

    /**
     * Callback fired whenever the input value changes due to user input. Called on each keystroke with the raw (untrimmed) value.
     */
    onValueChange?: (value: string | undefined) => void;

    /**
     * Callback fired when the input loses focus or when the Enter key is pressed. The value passed to this callback is trimmed.
     */
    onBlur?: (value: string | undefined) => void;

    /**
     * Callback fired when the input has error.
     */
    onErrorChange?: (hasError: boolean) => void;

    /**
     * Optional inline styles applied to the root container.
     */
    style?: CSSProperties;

    /**
     * Optional validator function. Receives the current value and returns null if valid, false string containing custom error messege.
     * When provided, validation runs on every change and on blur.
     */
    validator?: (value: string | undefined) => string | null;
}

export function UnstyledTextInput({
    prefix = "",
    value: controlledValue,
    defaultValue = "",
    maxLength = 80,
    canBeEmpty = false,
    placeholder = "Enter value...",
    tooltip = "",
    enabled = true,
    bold = false,
    permanentInputFieldBackground = false,
    onValueChange,
    onBlur,
    onErrorChange,
    style,
    validator,
}: UnstyledTextInputProps) {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;
    const trimmedValue = value.trim();

    const error: string | null =
        !trimmedValue && !canBeEmpty
            ? "Value cannot be empty!"
            : validator
            ? validator(trimmedValue)
            : null;

    useEffect(() => {
        onErrorChange?.(error !== null);
    }, [error, onErrorChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.currentTarget.value;
        if (val.length > maxLength) val = val.slice(0, maxLength);

        if (!isControlled) setInternalValue(val);
        onValueChange?.(val);
    };

    const handleKeyPressed = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleBlur();
            e.currentTarget.blur();
        }
    };

    const handleBlur = () => {
        onBlur?.(trimmedValue);
    };

    // Render the component.
    return (
        <div className="unstyledTextInput" style={style} title={tooltip}>
            <div className="unstyledTextInput__wrapper">
                {prefix && (
                    <span className="unstyledTextInput__prefix">{prefix}</span>
                )}
                <input
                    type="text"
                    disabled={!enabled}
                    value={value}
                    placeholder={placeholder}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyPressed}
                    // TODO: when permanent background is applied, we should get also darker hover and focus
                    className={`unstyledTextInput__input-field ${
                        error && enabled ? "unstyledTextInput__input-error" : ""
                    } ${bold ? "unstyledTextInput__input-field--bold" : ""} ${
                        permanentInputFieldBackground
                            ? "unstyledTextInput__input-field--permanentBackground"
                            : ""
                    }`}
                />
            </div>
            {error && enabled && (
                <span
                    className="unstyledTextInput__error-text"
                    style={{
                        paddingLeft: prefix ? `${prefix.length + 1}ch` : 1,
                    }}
                >
                    {error}
                </span>
            )}
        </div>
    );
}
