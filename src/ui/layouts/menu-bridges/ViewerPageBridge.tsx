import { createInitialMenuForViewerPageMenu } from "../../config/createInitialMenuForViewerPageMenu";
import { MenuProvider } from "../../providers/MenuProvider";

interface ViewerPageBridgeProps {
    children: React.ReactNode;
}

export function ViewerPageBridge({ children }: ViewerPageBridgeProps) {
    return (
        <MenuProvider initialMenu={() => createInitialMenuForViewerPageMenu()}>
            {children}
        </MenuProvider>
    );
}
