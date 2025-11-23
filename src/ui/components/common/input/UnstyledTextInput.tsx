import React, { useState, type CSSProperties } from "react";

import "./UnstyledTextInput.css";

interface UnstyledTextInputProps {
    prefix?: string;
    value?: string;
    defaultValue?: string;
    maxLength?: number;
    placeholder?: string;
    tooltip?: string;
    onValueChange?: (value: string | undefined) => void;
    onBlur?: (value: string | undefined) => void;
    style?: CSSProperties;
}

export function UnstyledTextInput({
    prefix = "",
    value: controlledValue,
    defaultValue = "",
    maxLength = 80,
    placeholder = "Enter value...",
    tooltip = "",
    onValueChange,
    onBlur,
    style,
}: UnstyledTextInputProps) {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.currentTarget.value.trim();
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
        if (!trimmedValue) {
            setError("Value cannot be empty!");
        } else {
            setError(null);
        }

        onBlur?.(trimmedValue);
    };

    return (
        <div className="unstyledTextInput" style={style} title={tooltip}>
            <div className="unstyledTextInput__input-wrapper">
                {prefix && (
                    <span className="unstyledTextInput__prefix">{prefix}</span>
                )}
                <input
                    type="text"
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
