export interface InactiveViewCardProps {
    title?: string;
    thumbnail?: Base64URLString;
    index: number;
    onClick?: () => void;
}

import { Button } from "../../../../../components/common/button/Button";
import { UnstyledTextInput } from "../../../../../components/common/input/UnstyledTextInput";
import { Thumbnail } from "../../../../../components/common/thumbnail/Thumbnail";
import "./ViewCard.css";

export function InactiveViewCard(props: InactiveViewCardProps) {
    return (
        <div className="viewCard">
            <div
                style={{
                    width: "100%",
                }}
            >
                <UnstyledTextInput
                    prefix={`${props.index + 1}. view`}
                    defaultValue={props.title}
                    placeholder={props.title}
                    tooltip={props.title}
                    enabled={false}
                    bold={true}
                    style={{
                        margin: "1em",
                    }}
                />
            </div>

            {props.thumbnail && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        paddingBottom: "1em",
                    }}
                >
                    <Thumbnail
                        onClick={() => {
                            if (props.onClick) {
                                props.onClick();
                            }
                        }}
                        title="Click to select this view."
                        src={props.thumbnail}
                        alt={`${props.title || `${props.index}. view`} - thumbnail`}
                    ></Thumbnail>
                </div>
            )}

            <div
                style={{
                    marginTop: "1em",
                    marginBottom: "1em",
                }}
            >
                <Button
                    size="small"
                    tooltip="Selects this view."
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
