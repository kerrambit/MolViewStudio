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
     * Callback fired whenever the input value changes due to user input. Called on each keystroke with the raw (untrimmed) value.
     */
    onValueChange?: (value: string | undefined) => void;

    /**
     * Callback fired when the input loses focus or when the Enter key is pressed. The value passed to this callback is trimmed.
     */
    onBlur?: (value: string | undefined) => void;

    /**
     * Optional inline styles applied to the root container.
     */
    style?: CSSProperties;
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
    onValueChange,
    onBlur,
    style,
}: UnstyledTextInputProps) {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.currentTarget.value;
        if (val.length > maxLength) val = val.slice(0, maxLength);

        if (!isControlled) setInternalValue(val);
        if (val.length > 0) setError(null);
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
        const trimmedValue = value.trim();
        if (!trimmedValue && !canBeEmpty) {
            setError("Value cannot be empty!");
        } else {
            setError(null);
        }

        onBlur?.(trimmedValue);
    };

    useEffect(() => {
        if (value.trim().length > 0) {
            setError(null);
        }
    }, [value]);

    return (
        <div className="unstyledTextInput" style={style} title={tooltip}>
            <div className="unstyledTextInput__input-wrapper">
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
                    className={`unstyledTextInput__input-field ${
                        error ? "unstyledTextInput__input-error" : ""
                    }`}
                />
            </div>
            {error && (
                <span
                    className="unstyledTextInput__error-text"
                    style={{ paddingLeft: prefix ? `${prefix.length}ch` : 0 }}
                >
                    {error}
                </span>
            )}
        </div>
    );
}
