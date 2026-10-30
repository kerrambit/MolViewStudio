/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Grid } from "@mantine/core";
import { getExtensionsOfferingProcessing } from "../../assets/domain/assetsDefinitions";
import { PerFormatProcessingSettingsPaper } from "./PerFormatProcessingSettingsPaper";

export function ProcessingPerFormatSettingsContent() {
    const extensions = getExtensionsOfferingProcessing();

    // Render the component.
    return (
        <Grid gap="md">
            {extensions.map((extension) => (
                <PerFormatProcessingSettingsPaper key={extension} extension={extension} />
            ))}
        </Grid>
    );
}
