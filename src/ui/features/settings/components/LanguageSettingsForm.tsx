/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useLanguageSettings } from "../hooks/useLanguageSettings";
import { SegmentedController } from "../../../components/common/segmented-controller/SegmentedController";

export function LanguageSettingsForm() {
    // Use translation.
    const { t } = useTranslation();

    // Use language settings.
    const { currentLanguage, changeLanguage } = useLanguageSettings();

    // Render the component.
    return (
        <Stack gap="xs" style={{ maxWidth: 350, width: "100%" }}>
            <Text component="label" fw={600} size="sm">
                Select the language:
            </Text>

            <SegmentedController
                value={currentLanguage}
                onChange={(value) => changeLanguage(value as "en" | "de")}
                data={[{ label: t("English"), value: "en" }]}
            />
        </Stack>
    );
}
