import { Group, Stack } from "@mantine/core";
import { useAppearance } from "../../providers/AppearanceProvider";
import { Button } from "../common/button/Button";
import { useTranslation } from "react-i18next";

export function ThemeSelector() {
    const { t } = useTranslation();
    const { setColorTheme, availableColorThemes, niceColorThemeNames } =
        useAppearance();

    return (
        <Stack gap="md">
            <Group>
                {availableColorThemes.map((_theme) => (
                    <Button
                        variant={"secondary"}
                        key={_theme}
                        tooltip={t(
                            `Choose color theme ${niceColorThemeNames[_theme]}.`,
                        )}
                        ariaLabel={t(
                            `Choose color theme ${niceColorThemeNames[_theme]}.`,
                        )}
                        onClick={() => setColorTheme(_theme)}
                    >
                        {niceColorThemeNames[_theme]}
                    </Button>
                ))}
            </Group>
        </Stack>
    );
}
