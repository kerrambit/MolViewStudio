import { MenuProvider } from "../../providers/MenuProvider";
import { bindMainMenu } from "../../config/menu/mainMenuBindings";

interface MainMenuBridgeProps {
    children: React.ReactNode;
}

export function MainMenuBridge({ children }: MainMenuBridgeProps) {
    return (
        <MenuProvider initialMenu={() => bindMainMenu()}>
            {children}
        </MenuProvider>
    );
}
