/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Divider, Text } from "@mantine/core";
import { Button } from "../../../components/common/button/Button";
import { pushInfoNotification } from "../../../services/NotificationService";
import { UiLocalStorageService } from "../../../services/UiLocalStorageService";
import { SchemeSelector } from "./SchemeSelector";
import { ThemeSelector } from "./ThemeSelector";

export function UiSettingsForm() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "1em",
            }}
        >
            <Text component="label" fw={600} size="sm">
                Select the light/dark mode:
            </Text>
            <div style={{ maxWidth: "20%" }}>
                <SchemeSelector />
            </div>

            <Divider my="sm" />

            <Text component="label" fw={600} size="sm">
                Select the theme:
            </Text>
            <div style={{ maxWidth: "75%" }}>
                <ThemeSelector />
            </div>

            <Divider my="sm" />

            <Text fw={600} size="sm">
                System maintenance:
            </Text>
            <Text size="xs" c="dimmed" style={{ lineHeight: 1 }}>
                Clear all temporary UI preferences (such as resetting whether
                the ViewBuilder sidebar has been opened).
            </Text>
            <div>
                <Button
                    variant="secondary"
                    size="medium"
                    label="Clear"
                    tooltip="Clears all temporary UI settings."
                    onClick={() => {
                        // TODO: this clears whole LocalStorage, if there are things outside UI, they will be cleared too
                        UiLocalStorageService.clear();
                        pushInfoNotification(
                            "Temporary UI settings has been successfully cleared.",
                        );
                    }}
                />
            </div>
        </div>
    );
}
