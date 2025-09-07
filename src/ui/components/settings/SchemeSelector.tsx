import { useMantineColorScheme, useComputedColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { Button } from "../common/button/Button";
import { useTranslation } from "react-i18next";

export function SchemeSelector() {
    const { t } = useTranslation();
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme("light");

    return (
        <div>
            <Button
                variant={"primary"}
                size="large"
                tooltip={t("Toggle scheme.")}
                ariaLabel={t("Toggle scheme.")}
                onClick={() =>
                    setColorScheme(
                        computedColorScheme === "light" ? "dark" : "light"
                    )
                }
            >
                {computedColorScheme === "light" ? (
                    <IconMoon size={20} />
                ) : (
                    <IconSun size={20} />
                )}
            </Button>
        </div>
    );
}
