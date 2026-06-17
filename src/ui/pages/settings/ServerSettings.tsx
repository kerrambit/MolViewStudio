import { BaseSettings } from "./BaseSettings";
import { useUserSettings } from "../../providers/UserSettingsProvider";
import { Stack, Paper, Group, Badge, Divider, Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { ServerStatus } from "../../features/system/components/server-status/ServerStatus";

export function ServerSettings() {
    // Use settings.
    const userSettings = useUserSettings();
    const { preferredServerPort, serverPort } = userSettings.settings;

    // Server might be running on different than preferred port.
    const isUsingAlternativePort = preferredServerPort !== serverPort;

    // Render component.
    return (
        <BaseSettings autoSavedPage={false}>
            <Paper withBorder p="md" radius="md" style={{ maxWidth: 480 }}>
                <Group justify="space-between" mb="xs">
                    <ServerStatus />
                </Group>

                <Divider mb="md" />

                <Stack gap="sm">
                    {isUsingAlternativePort && (
                        <Alert
                            variant="light"
                            color="blue"
                            title="Port change"
                            icon={<IconInfoCircle size={18} />}
                        >
                            Your preferred port ({preferredServerPort}) was
                            already used by another active window instance. The
                            application automatically selected an empty runtime
                            backup slot to prevent network collisions.
                        </Alert>
                    )}

                    <Group justify="space-between">
                        <span
                            style={{
                                color: "var(--mantine-color-dimmed)",
                                fontSize: "var(--mantine-font-size-sm)",
                            }}
                        >
                            Preferred port:
                        </span>
                        <span
                            style={{
                                fontWeight: 500,
                                fontFamily: "monospace",
                                fontSize: "var(--mantine-font-size-sm)",
                            }}
                        >
                            {preferredServerPort}
                        </span>
                    </Group>

                    <Group justify="space-between">
                        <span
                            style={{
                                color: "var(--mantine-color-dimmed)",
                                fontSize: "var(--mantine-font-size-sm)",
                            }}
                        >
                            Active runtime port:
                        </span>
                        <Group gap="xs">
                            <span
                                style={{
                                    fontWeight: 700,
                                    fontFamily: "monospace",
                                    fontSize: "var(--mantine-font-size-sm)",
                                }}
                            >
                                {serverPort}
                            </span>
                            {isUsingAlternativePort ? (
                                <Badge color="orange" variant="light" size="sm">
                                    Alternative Active
                                </Badge>
                            ) : (
                                <Badge color="green" variant="light" size="sm">
                                    Preferred Active
                                </Badge>
                            )}
                        </Group>
                    </Group>
                </Stack>
            </Paper>
        </BaseSettings>
    );
}
