/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { MenuProvider } from "../../menu/providers/MenuProvider";
import { bindViewerMenu } from "./viewerPageMenuBindings";

interface ViewerPageBridgeProps {
    children: React.ReactNode;
}

export function ViewerPageBridge({ children }: ViewerPageBridgeProps) {
    return <MenuProvider initialMenu={() => bindViewerMenu()}>{children}</MenuProvider>;
}
