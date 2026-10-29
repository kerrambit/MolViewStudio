/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { z } from "zod";
import { schemas } from "../../api/generated-schemas";

export type DownsamplingStrategy = z.infer<typeof schemas.DownsamplignAlgorithmKind>;

export function getDownsamplingStrategyOptions(): DownsamplingStrategy[] {
    return schemas.DownsamplignAlgorithmKind.options;
}
