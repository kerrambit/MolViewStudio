import { useState, type CSSProperties } from "react";

import "./UnstyledTextInput.css";

interface UnstyledTextInputProps {
    prefix?: string;
    defaultValue?: string;
    maxLength?: number;
    placeholder?: string;
    tooltip?: string;
    onValueChange?: (value: string | undefined) => void;
    style?: CSSProperties;
}

export function UnstyledTextInput({
    prefix = "",
    defaultValue = "",
    maxLength = 80,
    placeholder = "Enter value...",
    tooltip = "",
    onValueChange,
    style = undefined,
}: UnstyledTextInputProps) {
    const [value, setValue] = useState(defaultValue);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.currentTarget.value.trimStart();

        if (val.length > maxLength) val = val.slice(0, maxLength);

        setValue(val);
        if (val.length > 0) setError(null);

        onValueChange?.(val);
    };

    const handleBlur = () => {
        if (!value.trim()) {
            setError("Value cannot be empty!");
        }
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
