import { Button } from "../../../../../components/common/button/Button";

interface DeleteViewDialogueContentProps {
    viewName: string;
    close: (value?: boolean) => void;
}

export function DeleteViewDialogueContent({
    viewName,
    close,
}: DeleteViewDialogueContentProps) {
    // Render the component.
    return (
        <>
            <p style={{ marginBottom: "1rem" }}>
                {`Do you really want to delete '${viewName}' view?`}
            </p>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                }}
            >
                <Button variant={"ghost"} onClick={() => close(true)}>
                    Yes
                </Button>
                <Button onClick={() => close(false)}>Cancel</Button>
            </div>
        </>
    );
}
