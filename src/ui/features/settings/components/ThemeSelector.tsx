import { SimpleGrid, UnstyledButton, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useAppearance } from "../../../hooks/useAppearance";

export function ThemeSelector() {
    // Use apperance.
    const {
        colorScheme,
        colorTheme,
        setColorTheme,
        availableColorThemes,
        niceColorThemeNames,
    } = useAppearance();

    // Dark mode or light mode.
    const isDark = colorScheme === "dark";

    // Safely extract the active theme string name from the Mantine configuration object.
    const activeThemeName =
        typeof colorTheme === "string"
            ? colorTheme
            : colorTheme?.primaryColor || "";

    // Render the component.
    return (
        <SimpleGrid cols={{ sm: 6 }}>
            {availableColorThemes.map((theme) => {
                // Which themse is selected.
                const isSelected = activeThemeName === theme;

                // Prepare colors for table items based on the theme.
                const itemColorFilled = `var(--mantine-color-${theme}-filled)`;
                const itemColorText = `var(--mantine-color-${theme}- text)`;
                const itemColorLight = `var(--mantine-color-${theme}-light)`;

                const buttonBorder = isSelected
                    ? itemColorFilled
                    : isDark
                      ? "var(--mantine-color-dark-4)"
                      : "var(--mantine-color-gray-3)";

                const buttonBg = isSelected
                    ? itemColorLight
                    : isDark
                      ? "var(--mantine-color-dark-6)"
                      : "var(--mantine-color-gray-0)";

                // Render one theme button.
                return (
                    <UnstyledButton
                        key={theme}
                        onClick={() => setColorTheme(theme)}
                        title={`Choose color theme "${niceColorThemeNames[theme] || theme}".`}
                        style={{
                            padding: "1em",
                            borderRadius: "12px",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            border: `1px solid ${buttonBorder}`,
                            backgroundColor: buttonBg,
                        }}
                    >
                        {/* Title of theme in button. */}
                        <Text
                            size="sm"
                            fw={550}
                            style={{
                                color: isSelected
                                    ? isDark
                                        ? "var(--mantine-color-white)"
                                        : itemColorText
                                    : undefined,
                            }}
                        >
                            {niceColorThemeNames[theme] || theme}
                        </Text>

                        {/* Checkbox in button. */}
                        <div
                            style={{
                                width: 18,
                                height: 18,
                                borderRadius: "3px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: `1px solid`,
                                backgroundColor: isSelected
                                    ? itemColorFilled
                                    : "transparent",
                            }}
                        >
                            {isSelected && (
                                <IconCheck
                                    size={14}
                                    color="var(--mantine-color-white)"
                                />
                            )}
                        </div>
                    </UnstyledButton>
                );
            })}
        </SimpleGrid>
    );
}
