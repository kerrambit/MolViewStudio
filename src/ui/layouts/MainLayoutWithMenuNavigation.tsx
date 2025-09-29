import { MenuProvider } from "../services/MenuProvider";
import MainLayout from "./MainLayout";

export function MainLayoutWithMenuNavigation() {
    return (
        <MenuProvider>
            <MainLayout />
        </MenuProvider>
    );
}
