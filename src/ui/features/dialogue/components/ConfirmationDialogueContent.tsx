/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Button } from "../../../components/common/button/Button";

interface ConfirmationDialogueContentProps {
    close: (value?: boolean) => void;
    doYouReallyWantToQuestion: string | undefined;
}

export function ConfirmationDialogueContent({
    close,
    doYouReallyWantToQuestion,
}: ConfirmationDialogueContentProps) {
    return (
        <>
            <p style={{ marginBottom: "1rem" }}>
                You might have unsaved changes. {doYouReallyWantToQuestion}
            </p>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                }}
            >
                <Button variant={"ghost"} onClick={() => close(true)}>
                    Ok
                </Button>
                <Button onClick={() => close(false)}>Cancel</Button>
            </div>
        </>
    );
}
