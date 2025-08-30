import { ActionIcon, Group, Stack, Text } from "@mantine/core";
import { useMantineColorScheme, useComputedColorScheme } from "@mantine/core";
import { useTheme } from "../../services/ThemeProvider";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ThemeSelector() {
    const { setThemeType, availableThemesTypes } = useTheme();

    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme("light");

    const themeNames = {
        ocean: "Ocean Blue",
        forest: "Forest Green",
    };

    return (
        <Stack gap="md">
            <Text fw={500}>Choose Theme:</Text>
            <Group>
                {availableThemesTypes.map((_theme) => (
                    <button key={_theme} onClick={() => setThemeType(_theme)}>
                        {themeNames[_theme]}
                    </button>
                ))}
            </Group>

            <Text fw={500} mt="md">
                Light/Dark Mode:
            </Text>
            <ActionIcon
                onClick={() =>
                    setColorScheme(
                        computedColorScheme === "light" ? "dark" : "light"
                    )
                }
                variant="filled"
                aria-label="Theme Toggle"
                size="xl"
            >
                {computedColorScheme === "light" ? (
                    <IconMoon size={20} />
                ) : (
                    <IconSun size={20} />
                )}
            </ActionIcon>
        </Stack>
    );
}
