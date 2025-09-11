import { Navigate, type RouteObject } from "react-router-dom";
import Home from "../pages/Home.tsx";
import Settings from "../pages/Settings.tsx";
import MainLayout from "../layouts/MainLayout.tsx";

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
        ],
    },
    {
        path: "*",
        element: <Navigate to="/" />,
    },
];

export default routes;
