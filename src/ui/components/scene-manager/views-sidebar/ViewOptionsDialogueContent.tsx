import { useState, useMemo } from "react";
import {
    Text,
    NumberInput,
    ColorInput,
    Checkbox,
    Divider,
    Textarea,
    Typography,
} from "@mantine/core";
import ReactMarkdown from "react-markdown";
import { Button } from "../../common/button/Button";
import { SegmentedController } from "../../common/segmented-controller/SegmentedController";
import { useRegime } from "../../../services/RegimeProvider";
import type { HexColor } from "../../../../molstar-wrapper/src";
import { useAppearance } from "../../../services/AppearanceProvider";

export interface ViewOptionsDialogueContentReturnType {
    lingerDuration: number;
    transitionDuration: number | undefined;
    canvasColor: HexColor | undefined;
    captureScreenshot: boolean;
    descriptionFormat: "plaintext" | "markdown" | undefined;
    description: string | undefined;
}

interface ViewOptionsDialogueContentProps {
    viewKey: string;
    backgroundColor?: HexColor;
    thumbnail?: Base64URLString;
    close: (value?: ViewOptionsDialogueContentReturnType) => void;
}

export function ViewOptionsDialogueContent({
    viewKey,
    backgroundColor,
    thumbnail,
    close,
}: ViewOptionsDialogueContentProps) {
    // Use regime.
    const { regime } = useRegime();

    const { colorScheme } = useAppearance();

    // Memoized view.
    const view = useMemo(() => {
        if (regime.kind !== "viewing") return null;
        return regime.stateTree.snapshots.find(
            (snap) => snap.metadata.key === viewKey,
        );
    }, [regime, viewKey]);

    // All view properies in the View Option dialogue.

    const [lingerDuration, setLingerDuration] = useState<number>(
        view?.metadata.linger_duration_ms ?? 5000,
    );
    const [transitionDuration, setTransitionDuration] = useState<
        number | undefined
    >(view?.metadata.transition_duration_ms);

    const [canvasColor, setCanvasColor] = useState<HexColor | undefined>(
        backgroundColor as HexColor,
    );

    const [captureScreenshot, setCaptureScreenshot] = useState<boolean>(
        thumbnail !== undefined ? true : false,
    );

    const [descriptionFormat, setDescriptionFormat] = useState<
        "plaintext" | "markdown"
    >(
        (view?.metadata.description_format as "plaintext" | "markdown") ??
            "markdown",
    );

    const [description, setDescription] = useState<string | undefined>(
        view?.metadata.description,
    );

    // Render.
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "2em",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1em",
                        flex: 1,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Text size="sm">Linger duration in miliseconds:</Text>
                        <NumberInput
                            value={lingerDuration}
                            onChange={(val) =>
                                setLingerDuration(Number(val) || 5000)
                            }
                            size="sm"
                            style={{ width: "140px" }}
                            hideControls
                        />
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Text size="sm">
                            Transition duration in miliseconds:
                        </Text>
                        <NumberInput
                            value={transitionDuration}
                            onChange={(val) =>
                                setTransitionDuration(Number(val) || 0)
                            }
                            size="sm"
                            style={{ width: "140px" }}
                            hideControls
                        />
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1em",
                        flex: 1,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1em",
                        }}
                    >
                        <Text size="sm" style={{ width: "120px" }}>
                            Canvas color:
                        </Text>
                        <ColorInput
                            value={canvasColor}
                            onChange={(val) => {
                                if (val !== "") {
                                    setCanvasColor(val as HexColor);
                                } else {
                                    setCanvasColor(undefined);
                                }
                            }}
                            size="sm"
                            format="hex"
                            popoverProps={{ zIndex: 10000 }}
                        />
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1em",
                        }}
                    >
                        <Text size="sm" style={{ width: "120px" }}>
                            Capture screenshot:
                        </Text>
                        <Checkbox
                            checked={captureScreenshot}
                            onChange={(e) =>
                                setCaptureScreenshot(e.currentTarget.checked)
                            }
                            size="sm"
                        />
                    </div>
                </div>
            </div>

            <Divider my="sm" color="gray.4" />

            <div style={{ display: "flex", alignItems: "center", gap: "1em" }}>
                <Text fw={700}>Description:</Text>
                <SegmentedController<"plaintext" | "markdown">
                    value={descriptionFormat}
                    onChange={setDescriptionFormat}
                    data={[
                        { label: "Markdown", value: "markdown" },
                        { label: "Plaintext", value: "plaintext" },
                    ]}
                />
            </div>

            <div style={{ display: "flex", gap: "1em", height: "250px" }}>
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                        styles={{
                            root: { height: "100%" },
                            wrapper: { height: "100%" },
                            input: {
                                height: "100%",
                                backgroundColor:
                                    colorScheme === "dark"
                                        ? "var(--color-dark-ui-component-mantine)"
                                        : "var(--color-light-ui-component-mantine)",
                                color: "var(--input-color)",
                                border: "none",
                            },
                        }}
                        style={{ height: "100%" }}
                    />
                </div>

                <div
                    style={{
                        flex: 1,
                        backgroundColor:
                            colorScheme === "dark"
                                ? "var(--color-dark-ui-component-mantine)"
                                : "var(--color-light-ui-component-mantine)",
                        color: "var(--input-color)",
                        borderRadius: "6px",
                        padding: "0.75em",
                        overflowY: "auto",
                        display: description ? "block" : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {!description ? (
                        <Text c="dimmed">
                            This is what what you will see in Molstar's UI...
                        </Text>
                    ) : descriptionFormat === "markdown" ? (
                        <Typography p={0}>
                            <ReactMarkdown>{description}</ReactMarkdown>
                        </Typography>
                    ) : (
                        <Text style={{ whiteSpace: "pre-wrap" }}>
                            {description}
                        </Text>
                    )}
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "1em",
                }}
            >
                <Button
                    label="Save"
                    variant="primary"
                    onClick={() => {
                        let _description = description;
                        let _descriptionFormat = descriptionFormat as
                            | "plaintext"
                            | "markdown"
                            | undefined;
                        if (description === "") {
                            _description = undefined;
                            _descriptionFormat = undefined;
                        }
                        close({
                            lingerDuration,
                            transitionDuration,
                            canvasColor,
                            captureScreenshot,
                            descriptionFormat: _descriptionFormat,
                            description: _description,
                        });
                    }}
                    tooltip="Save view options."
                />
            </div>
        </div>
    );
}
