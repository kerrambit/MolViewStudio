import { Navigate, type RouteObject } from "react-router-dom";
import Home from "../pages/home/Home.tsx";
import Settings from "../pages/Settings.tsx";
import MainLayout from "../layouts/MainLayout.tsx";
import { Viewer } from "../pages/viewer/Viewer.tsx";
import { SidebarPage } from "../pages/SidebarPage.tsx";

const routes: RouteObject[] = [
    {
        path: "/",
        element: <Navigate to="/home" />,
    },
    {
        path: "/",
        Component: MainLayout,
        children: [
            { path: "home", Component: Home },
            { path: "settings", Component: Settings },
            { path: "viewer", Component: Viewer },
            { path: "sidebar", Component: SidebarPage },
        ],
    },
    {
        path: "*",
        element: <Navigate to="/" />,
    },
];

export default routes;
