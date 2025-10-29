import { useState } from "react";
import { Button } from "../common/button/Button";
import { UnstyledTextInput } from "../common/input/UnstyledTextInput";

import "./ViewCard.css";

export interface ViewCardProps {
    title: string;
    index: number;
    onClick?: () => void;
    thumbnail?: string;
    onSave?: (newTitle: string) => void;
}

export function ViewCard(props: ViewCardProps) {
    const [_, setCurrentName] = useState<string | undefined>(props.title);

    return (
        <div className="viewCard">
            <div
                style={{
                    width: "100%",
                }}
            >
                <UnstyledTextInput
                    prefix={`${props.index + 1}. `}
                    defaultValue={props.title}
                    placeholder="Change name for this view..."
                    tooltip="Change name for this view..."
                    onValueChange={(val) => {
                        setCurrentName(val);
                        if (val) {
                            props.onSave?.(val);
                        }
                    }}
                    style={{
                        margin: "1em",
                    }}
                />
            </div>

            <img
                onClick={() => {
                    if (props.onClick) {
                        props.onClick();
                    }
                }}
                style={{
                    cursor: "pointer",
                    maxWidth: "90%",
                    borderRadius: "6px",
                }}
                title="Click to set the current camera position to this view."
                src={props.thumbnail}
                alt={`${props.title} - thumbnail`}
            />
            <div
                style={{
                    display: "flex",
                    paddingTop: "1em",
                    paddingBottom: "1em",
                }}
            >
                <Button
                    size="small"
                    tooltip="The current camera position will be set to this view."
                    label="Load view"
                    variant="secondary"
                    onClick={() => {
                        if (props.onClick) {
                            props.onClick();
                        }
                    }}
                ></Button>
            </div>
        </div>
    );
}
