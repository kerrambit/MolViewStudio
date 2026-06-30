import { Text, Divider, Stack } from "@mantine/core";
import { SliderInputGroup } from "../../../../../components/common/slider-input-group/SliderInputGroup";
import type { VolumeViewModel } from "../../../hooks/useViewBuilder";

type TransformControlsProps = {
    viewModel: VolumeViewModel;
    onUpdateParam: (
        key: keyof VolumeViewModel,
        val: any,
        sync: boolean,
    ) => void;
};

// TODO: set these in settings
const TRANSLATION_MIN = -100;
const TRANSLATION_MAX = 100;
const ROTATION_MIN = -180;
const ROTATION_MAX = 180;

export function TransformControls(props: TransformControlsProps) {
    // Render the component.
    return (
        <Stack gap="md" pb="sm">
            <div>
                <Text fw={550} size="sm" mb="xs">
                    Translation (Å)
                </Text>
                <SliderInputGroup
                    label="X axis"
                    labelColor="red"
                    value={props.viewModel.translationX}
                    sliderMin={TRANSLATION_MIN}
                    sliderMax={TRANSLATION_MAX}
                    sliderStep={0.5}
                    textInputStep={0.5}
                    onChange={(val: number) =>
                        props.onUpdateParam("translationX", val, false)
                    }
                    onChangeEnd={(val: number) =>
                        props.onUpdateParam("translationX", val, true)
                    }
                />
                <SliderInputGroup
                    label="Y axis"
                    labelColor="green"
                    value={props.viewModel.translationY}
                    sliderMin={TRANSLATION_MIN}
                    sliderMax={TRANSLATION_MAX}
                    sliderStep={0.5}
                    textInputStep={0.5}
                    onChange={(val: number) =>
                        props.onUpdateParam("translationY", val, false)
                    }
                    onChangeEnd={(val: number) =>
                        props.onUpdateParam("translationY", val, true)
                    }
                />
                <SliderInputGroup
                    label="Z axis"
                    labelColor="blue"
                    value={props.viewModel.translationZ}
                    sliderMin={TRANSLATION_MIN}
                    sliderMax={TRANSLATION_MAX}
                    sliderStep={0.5}
                    textInputStep={0.5}
                    onChange={(val: number) =>
                        props.onUpdateParam("translationZ", val, false)
                    }
                    onChangeEnd={(val: number) =>
                        props.onUpdateParam("translationZ", val, true)
                    }
                />
            </div>

            <Divider />

            <div>
                <Text fw={550} size="sm" mb="xs">
                    Rotation Angles (°)
                </Text>
                <SliderInputGroup
                    label="Pitch (X)"
                    labelColor="red"
                    value={props.viewModel.rotationX}
                    sliderMin={ROTATION_MIN}
                    sliderMax={ROTATION_MAX}
                    sliderStep={1}
                    textInputStep={1}
                    onChange={(val: number) =>
                        props.onUpdateParam("rotationX", val, false)
                    }
                    onChangeEnd={(val: number) =>
                        props.onUpdateParam("rotationX", val, true)
                    }
                />
                <SliderInputGroup
                    label="Yaw (Y)"
                    labelColor="green"
                    value={props.viewModel.rotationY}
                    sliderMin={ROTATION_MIN}
                    sliderMax={ROTATION_MAX}
                    sliderStep={1}
                    textInputStep={1}
                    onChange={(val: number) =>
                        props.onUpdateParam("rotationY", val, false)
                    }
                    onChangeEnd={(val: number) =>
                        props.onUpdateParam("rotationY", val, true)
                    }
                />
                <SliderInputGroup
                    label="Roll (Z)"
                    labelColor="blue"
                    value={props.viewModel.rotationZ}
                    sliderMin={ROTATION_MIN}
                    sliderMax={ROTATION_MAX}
                    sliderStep={1}
                    textInputStep={1}
                    onChange={(val: number) =>
                        props.onUpdateParam("rotationZ", val, false)
                    }
                    onChangeEnd={(val: number) =>
                        props.onUpdateParam("rotationZ", val, true)
                    }
                />
            </div>
        </Stack>
    );
}
