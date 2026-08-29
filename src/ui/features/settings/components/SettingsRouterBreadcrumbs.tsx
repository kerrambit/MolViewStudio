/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { RouterLocationBreadcrumbs } from "../../../components/common/router-location-breadcrumbs/RouterLocationBreadcrumbs";

export function SettingsRouterBreadcrumbs() {
    // Synonyms.
    const wordsToFix = [{ location: "ui", synonym: "UI" }];

    // Render the component.
    return <RouterLocationBreadcrumbs locationSynonyms={wordsToFix} />;
}
