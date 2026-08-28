/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { bindViewerMenu } from "../../config/menu/viewerPageMenuBindings";
import { MenuProvider } from "../../providers/MenuProvider";

interface ViewerPageBridgeProps {
    children: React.ReactNode;
}

export function ViewerPageBridge({ children }: ViewerPageBridgeProps) {
    return (
        <MenuProvider initialMenu={() => bindViewerMenu()}>
            {children}
        </MenuProvider>
    );
}
