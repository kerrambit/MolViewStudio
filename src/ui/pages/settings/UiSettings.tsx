import { Button } from "../../components/common/button/Button";
import { SchemeSelector } from "../../components/settings/SchemeSelector";
import { ThemeSelector } from "../../components/settings/ThemeSelector";
import { pushInfoNotification } from "../../services/NotificationService";
import { UiLocalStorageService } from "../../services/UiLocalStorageService";
import { BaseSettings } from "../../features/settings/components/BaseSettings";

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

                <label style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    Clear all temporary UI settings (such as if ViewBuilder
                    sidebar has been opened):
                </label>
                <div>
                    <Button
                        variant="primary"
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
        </BaseSettings>
    );
}
