/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Slider, NumberInput, Group, Text } from "@mantine/core";

interface SliderInputGroupProps {
    label: string;
    labelColor?: string;
    value: number;
    sliderMin: number;
    sliderMax: number;
    sliderStep: number;
    textInputStep: number;
    onChange: (val: number) => void;
    onChangeEnd: (val: number) => void;
}

export function SliderInputGroup(props: SliderInputGroupProps) {
    // Render the component.
    return (
        <Group wrap="nowrap" align="center" gap="1em">
            <Text size="xs" fw={525} w={25} c={props.labelColor}>
                {props.label}
            </Text>

            <Slider
                value={props.value}
                onChange={props.onChange}
                onChangeEnd={props.onChangeEnd}
                min={props.sliderMin}
                max={props.sliderMax}
                step={props.sliderStep}
                style={{ flex: 1 }}
            />

            <NumberInput
                value={props.value}
                onChange={(val) => {
                    if (typeof val === "number") {
                        props.onChange(val);
                    } else if (val === "") {
                        props.onChange(0);
                    } else {
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed)) props.onChange(parsed);
                    }
                }}
                onBlur={() => {
                    props.onChangeEnd(props.value);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        props.onChangeEnd(props.value);
                    }
                }}
                step={props.textInputStep}
                decimalScale={2}
                w={80}
                size="xs"
            />
        </Group>
    );
}
