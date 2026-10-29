/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { MenuProvider } from "../../menu/providers/MenuProvider";
import { bindMainMenu } from "./homePageMenuBindings";

interface MainMenuBridgeProps {
    children: React.ReactNode;
}

export function HomePageMenuBridge({ children }: MainMenuBridgeProps) {
    return <MenuProvider initialMenu={() => bindMainMenu()}>{children}</MenuProvider>;
}
