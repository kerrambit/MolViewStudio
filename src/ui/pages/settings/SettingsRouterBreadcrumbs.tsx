import { RouterBreadcrumbs } from "../../components/common/router-breadcrumbs/RouterBreadcrumbs";

interface SettingsRouterBreadcrumbsProps {
    autoSavedPage: boolean;
}

export function SettingsRouterBreadcrumbs(
    props: SettingsRouterBreadcrumbsProps
) {
    const wordsToFix = {
        words: [{ word: "ui", fixed: "UI" }],
    };
    return (
        <div>
            <RouterBreadcrumbs wordsToFix={wordsToFix} />
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
