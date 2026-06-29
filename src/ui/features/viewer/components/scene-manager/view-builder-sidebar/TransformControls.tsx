import { Text } from "@mantine/core";

type TransformControlsProps = {};

export function TransformControls(_props: TransformControlsProps) {
    return (
        <div>
            <Text>Translation</Text>
            <Text>Rotation pivot</Text>
            <Text>Rotation (Pitch / Yaw / Roll)</Text>
        </div>
    );
}
