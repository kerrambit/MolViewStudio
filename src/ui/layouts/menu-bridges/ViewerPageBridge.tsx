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
