import { Group, Stack } from "@mantine/core";
import { useTheme } from "../../services/ThemeProvider";
import { Button } from "../common/button/Button";
import { useTranslation } from "react-i18next";

export function ThemeSelector() {
    const { t } = useTranslation();

    const { setThemeType, availableThemeTypes, niceThemeTypeNames } =
        useTheme();

    return (
        <Stack gap="md">
            <Group>
                {availableThemeTypes.map((_theme) => (
                    <Button
                        variant={"secondary"}
                        key={_theme}
                        tooltip={t(
                            `Choose color theme ${niceThemeTypeNames[_theme]}.`
                        )}
                        ariaLabel={t(
                            `Choose color theme ${niceThemeTypeNames[_theme]}.`
                        )}
                        onClick={() => setThemeType(_theme)}
                    >
                        {niceThemeTypeNames[_theme]}
                    </Button>
                ))}
            </Group>
        </Stack>
    );
}
