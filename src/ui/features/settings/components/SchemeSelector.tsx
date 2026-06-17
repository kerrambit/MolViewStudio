import { IconMoon, IconSun } from "@tabler/icons-react";
import { useAppearance } from "../../../providers/AppearanceProvider";
import { SegmentedController } from "../../../components/common/segmented-controller/SegmentedController";
import { Center, Text } from "@mantine/core";

export function SchemeSelector() {
    // Use apperance.
    const { colorScheme, setColorScheme } = useAppearance();

    // Render the component.
    return (
        <div>
            <SegmentedController
                value={colorScheme}
                onChange={(value) => setColorScheme(value as "light" | "dark")}
                data={[
                    {
                        value: "light",
                        label: (
                            <Center style={{ gap: 8 }}>
                                <Text size="sm" fw={550}>
                                    Light
                                </Text>
                                <IconSun size={20} />
                            </Center>
                        ),
                    },
                    {
                        value: "dark",
                        label: (
                            <Center style={{ gap: 8 }}>
                                <Text size="sm" fw={550}>
                                    Dark
                                </Text>
                                <IconMoon size={20} />
                            </Center>
                        ),
                    },
                ]}
            />
        </div>
    );
}
