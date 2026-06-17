import { RouterLocationBreadcrumbs } from "../../components/common/router-location-breadcrumbs/RouterLocationBreadcrumbs";

interface SettingsRouterBreadcrumbsProps {
    autoSavedPage: boolean;
}

export function SettingsRouterBreadcrumbs(
    props: SettingsRouterBreadcrumbsProps,
) {
    const wordsToFix = [{ location: "ui", synonym: "UI" }];
    return (
        <div>
            <RouterLocationBreadcrumbs locationSynonyms={wordsToFix} />
            {props.autoSavedPage && (
                <div
                    title="Auto-save means that when you make any change in the page, the change is automatically registered and set."
                    style={{
                        fontSize: "0.9em",
                    }}
                >
                    This page is auto-saved.
                </div>
            )}
        </div>
    );
}
