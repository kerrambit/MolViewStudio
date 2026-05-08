import { Textarea } from "@mantine/core";
import { useState, type CSSProperties } from "react";

import "./UnstyledTextArea.css";

/**
 * Properties for UnstyledTextArea.
 */
interface UnstyledTextAreaProps {
    /** Controlled value of the text area. */
    value?: string;

    /** Placeholder text shown when the text area is empty. */
    placeholder?: string;

    /** Optional tooltip text displayed on hover. */
    tooltip?: string;

    /** Whether the text area is enabled. Default is `true`. */
    enabled?: boolean;

    /** Minimum number of rows to display. Default is 4. */
    minRows?: number;

    /** Maximum number of rows to display before scrolling. Default is 8. */
    maxRows?: number;

    /** Callback fired whenever the input value changes. */
    onValueChange?: (value: string | undefined) => void;

    /** Callback fired when the input loses focus. The value is trimmed. */
    onBlur?: (value: string | undefined) => void;

    /** Optional inline styles applied to the root container. */
    style?: CSSProperties;
}

export function UnstyledTextArea({
    value: controlledValue,
    placeholder = "Enter text...",
    tooltip = "",
    enabled = true,
    minRows = 8,
    maxRows = 16,
    onValueChange,
    onBlur,
    style,
}: UnstyledTextAreaProps) {
    const [internalValue, setInternalValue] = useState("");
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = event.currentTarget.value;
        if (!isControlled) setInternalValue(val);
        onValueChange?.(val);
    };

    const handleBlur = () => {
        const trimmedValue = value.trim();
        onBlur?.(trimmedValue);
    };

    return (
        <div style={style} title={tooltip}>
            <Textarea
                value={value}
                disabled={!enabled}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                autosize
                minRows={minRows}
                maxRows={maxRows}
                variant="unstyled"
                error={null}
                classNames={{
                    input: "unstyledTextArea",
                }}
            />
        </div>
    );
}
