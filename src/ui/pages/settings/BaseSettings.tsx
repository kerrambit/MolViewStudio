import type { ReactNode } from "react";
import { SettingsRouterBreadcrumbs } from "./SettingsRouterBreadcrumbs";
import Watermark from "../../components/common/watermark/Watermark";
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
        <div className="settings">
            <Watermark icon={IconSettingsFilled} />
            <div style={{ paddingBottom: "2em" }}>
                <SettingsRouterBreadcrumbs autoSavedPage={autoSavedPage} />
            </div>
            {children}
        </div>
    );
}
