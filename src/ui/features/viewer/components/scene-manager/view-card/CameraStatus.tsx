import { Text } from "@mantine/core";

interface CameraStatusProps {
    doesReferenceCameraExist: boolean;
    isCameraMoved: boolean;
}

export function CameraStatus(props: CameraStatusProps) {
    let statusText = "No camera saved.";
    let statusColor = "var(--mantine-color-gray-6)";

    if (props.doesReferenceCameraExist) {
        if (props.isCameraMoved) {
            statusText = "Camera has moved.";
            statusColor = "var(--mantine-color-orange-5)";
        } else {
            statusText = "Camera saved.";
            statusColor = "#33ff00";
        }
    }

    return (
        <div
            title={statusText}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5em",
                marginTop: "0.5em",
            }}
        >
            <div
                style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: statusColor,
                }}
            />
            <Text size="sm">{statusText}</Text>
        </div>
    );
}
