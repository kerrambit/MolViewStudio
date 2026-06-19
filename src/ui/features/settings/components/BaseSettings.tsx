import type { ReactNode } from "react";
import { Text } from "@mantine/core";
import { SettingsRouterBreadcrumbs } from "./SettingsRouterBreadcrumbs";
import Watermark from "../../../components/common/watermark/Watermark";
import { IconSettingsFilled } from "@tabler/icons-react";

interface BaseSettingsProps {
    children?: ReactNode;
    autoSavedPage?: boolean;
}

export function BaseSettings({
    children,
    autoSavedPage = true,
}: BaseSettingsProps) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                marginLeft: "3em",
                marginRight: "3em",
            }}
        >
            <Watermark icon={IconSettingsFilled} />
            <div style={{ paddingBottom: "2em" }}>
                <SettingsRouterBreadcrumbs />
                {autoSavedPage && (
                    <Text
                        title="Auto-save means that when you make any change in the page, the change is immediately saved."
                        component="label"
                        fw={400}
                        size="sm"
                    >
                        This page is auto-saved.
                    </Text>
                )}
            </div>
            {children}
        </div>
    );
}
