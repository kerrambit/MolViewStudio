import { useCallback, useState } from "react";
import { Button } from "../../components/common/button/Button";
import { useRegime } from "../../services/RegimeProvider";
import { MVSData } from "molstar/lib/extensions/mvs/mvs-data";
import { pushWarningNotification } from "../../services/NotificationService";

import "./ShowMVSTreeDialogueContent.css";

interface ShowMVSTreeDialogueContentProps {
    close: () => void;
}

export function ShowMVSTreeDialogueContent({
    close,
}: ShowMVSTreeDialogueContentProps) {
    // Use regime.
    const { regime } = useRegime();

    // State for holding information if MVS tree was copied.
    const [copied, setCopied] = useState(false);

    // Handler for copy action.
    const handleCopy = useCallback(async () => {
        if (regime.kind !== "viewing") return;

        try {
            const prettyString = MVSData.toPrettyString(regime.stateTree);
            await navigator.clipboard.writeText(prettyString);
            setCopied(true);
        } catch (error) {
            pushWarningNotification(
                `Failed to copy the MVS tree! Details: <${error}>.`,
            );
        }
    }, [regime]);

    if (regime.kind !== "viewing") {
        return null;
    }

    // Render component.
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
            }}
        >
            {/* Preformatted text of MVS tree. */}
            <pre className="show-mvs-tree-dialogue-content__source-code">
                {MVSData.toPrettyString(regime.stateTree)}
            </pre>

            {/* Buttons. */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "16px",
                    paddingTop: "1em",
                }}
            >
                <Button
                    variant="secondary"
                    size="small"
                    tooltip="Copies the MVS tree."
                    label={copied ? "✓ Copied" : "Copy"}
                    onClick={handleCopy}
                />

                <Button
                    variant="secondary"
                    size="small"
                    tooltip="Closes the dialogue window."
                    label="OK"
                    onClick={close}
                />
            </div>
        </div>
    );
}
