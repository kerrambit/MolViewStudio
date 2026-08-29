/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useEffect, useState } from "react";
import { Text } from "@mantine/core";
import { UnstyledTextInput } from "../input/UnstyledTextInput";

interface PathSegmentsBuilderProps {
    count?: number;
    inputPathSegments?: string[];
    onChange?: (segments: string[], hasError: boolean) => void;
}

export function PathSegmentsBuilder({
    count = 3,
    inputPathSegments = [],
    onChange,
}: PathSegmentsBuilderProps) {
    // State for up to  path segments for a relative path of asset.
    const [pathSegments, setPathSegments] = useState<string[]>(() =>
        Array.from(
            { length: count },
            (_, index) => inputPathSegments[index] || "",
        ),
    );

    // State for storing possible error on a given path segment.
    const [segmentErrors, setSegmentErrors] = useState<boolean[]>(() =>
        Array(count).fill(false),
    );

    // Compute whether any item in the sequence contains a validation error.
    const hasGlobalError = segmentErrors.some((error) => error);

    // Automatically synchronize state changes directly to the parent hook layer.
    useEffect(() => {
        onChange?.(pathSegments, hasGlobalError);
    }, [pathSegments, hasGlobalError, onChange]);

    // Handler for segment change.
    const handleSegmentChange = (
        index: number,
        newValue: string | undefined,
    ) => {
        const updatedSegments = [...pathSegments];
        updatedSegments[index] = newValue || "";
        setPathSegments(updatedSegments);
    };

    // Handler for segment error.
    const handleValidationError = (index: number, hasError: boolean) => {
        setSegmentErrors((prev) => {
            if (prev[index] === hasError) return prev;
            const newErrors = [...prev];
            newErrors[index] = hasError;
            return newErrors;
        });
    };

    // Render the component.
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "1em",
                flexGrow: 1,
            }}
        >
            {pathSegments.map((segment, index) => (
                <div
                    key={index}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5em",
                    }}
                >
                    <UnstyledTextInput
                        value={segment}
                        enabled={
                            index === 0 || pathSegments[index - 1].trim() !== ""
                        }
                        canBeEmpty={pathSegments
                            .slice(index + 1)
                            .every((seg) => seg.trim() === "")}
                        onValueChange={(val) => handleSegmentChange(index, val)}
                        onBlur={(val) => handleSegmentChange(index, val)}
                        onErrorChange={(hasError) =>
                            handleValidationError(index, hasError)
                        }
                        style={{ width: "11em" }}
                    />
                    {index < pathSegments.length - 1 && (
                        <Text c="dimmed">/</Text>
                    )}
                </div>
            ))}
        </div>
    );
}
