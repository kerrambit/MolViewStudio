import { Navigate, type RouteObject } from "react-router-dom";
import Home from "../pages/home/Home.tsx";
import Settings from "../pages/settings/Settings.tsx";
import { Viewer } from "../pages/viewer/Viewer.tsx";
import { SidebarPage } from "../pages/SidebarPage.tsx";
import { MainLayoutWithMenuNavigation } from "../layouts/MainLayoutWithMenuNavigation.tsx";
import { BackNavigationLayout } from "../layouts/BackNavigationLayout.tsx";
import OldSettings from "../pages/OldSettings.tsx";

const routes: RouteObject[] = [
    {
        path: "/",
        element: <Navigate to="/home" />,
    },
    {
        path: "/",
        Component: MainLayoutWithMenuNavigation,
        children: [
            { path: "home", Component: Home },
            { path: "viewer", Component: Viewer },
            { path: "sidebar", Component: SidebarPage },
        ],
    },
    {
        path: "/settings",
        Component: BackNavigationLayout,
        children: [{ index: true, Component: Settings }],
    },
    {
        path: "/old-settings",
        Component: BackNavigationLayout,
        children: [{ index: true, Component: OldSettings }],
    },
    {
        path: "*",
        element: <Navigate to="/" />,
    },
];

export default routes;
