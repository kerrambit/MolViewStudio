import { RouterLocationBreadcrumbs } from "../../../components/common/router-location-breadcrumbs/RouterLocationBreadcrumbs";

export function SettingsRouterBreadcrumbs() {
    // Synonyms.
    const wordsToFix = [{ location: "ui", synonym: "UI" }];

    // Render the component.
    return <RouterLocationBreadcrumbs locationSynonyms={wordsToFix} />;
}
