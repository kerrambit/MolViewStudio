import { useTranslation } from "react-i18next";
import { IconSettingsFilled } from "@tabler/icons-react";

export default function Settings() {
    const { t } = useTranslation();

    return (
        <div>
            <h1>{t("Settings")}</h1>

            <IconSettingsFilled
                size={160}
                color="var(--mantine-color-dimmed)"
                stroke={1.5}
            />
        </div>
    );
}
