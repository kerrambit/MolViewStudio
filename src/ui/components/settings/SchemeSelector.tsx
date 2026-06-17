import { IconMoon, IconSun } from "@tabler/icons-react";
import { Button } from "../common/button/Button";
import { useTranslation } from "react-i18next";
import { useAppearance } from "../../providers/AppearanceProvider";

export function SchemeSelector() {
    const { t } = useTranslation();
    const { colorScheme, setColorScheme } = useAppearance();

    return (
        <div>
            <Button
                variant={"secondary"}
                size="large"
                tooltip={t("Toggle scheme.")}
                ariaLabel={t("Toggle scheme.")}
                onClick={() =>
                    setColorScheme(colorScheme === "light" ? "dark" : "light")
                }
            >
                {colorScheme === "light" ? (
                    <IconMoon size={20} />
                ) : (
                    <IconSun size={20} />
                )}
            </Button>
        </div>
    );
}
