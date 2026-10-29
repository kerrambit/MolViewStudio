/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { z } from "zod";
import { schemas } from "../../api/generated-schemas";

export type SerializerKind = z.infer<typeof schemas.SerializerKind>;

export function getSerializerKindOptions(): SerializerKind[] {
    return schemas.SerializerKind.options;
}
