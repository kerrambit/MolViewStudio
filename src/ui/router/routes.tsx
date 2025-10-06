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
        children: [
            { index: true, Component: Settings },
            {
                path: "general",
                Component: Settings,
                children: [
                    { path: "language", Component: Settings },
                    { path: "ui", Component: Settings },
                    { path: "notifications", Component: Settings },
                    { path: "help", Component: Settings },
                ],
            },
            {
                path: "account",
                Component: Settings,
                children: [{ index: true, Component: Settings }],
            },
            {
                path: "server",
                Component: Settings,
                children: [{ index: true, Component: Settings }],
            },
            {
                path: "account",
                Component: Settings,
                children: [{ index: true, Component: Settings }],
            },
            {
                path: "formats",
                Component: Settings,
                children: [
                    { path: "input", Component: Settings },
                    { path: "export", Component: Settings },
                ],
            },
            {
                path: "processing",
                Component: Settings,
                children: [
                    { path: "general", Component: Settings },
                    { path: "per-format", Component: Settings },
                ],
            },
        ],
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
