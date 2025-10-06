import { SchemeSelector } from "../../components/settings/SchemeSelector";
import { ThemeSelector } from "../../components/settings/ThemeSelector";
import { BaseSettings } from "./BaseSettings";

export function UiSettings() {
    return (
        <BaseSettings>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                }}
            >
                <label style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    Select the light/dark mode:
                </label>
                <SchemeSelector />

                <label style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    Select the theme:
                </label>
                <ThemeSelector />
            </div>
        </BaseSettings>
    );
}
