import { Navigate, type RouteObject } from "react-router-dom";
import Home from "../pages/Home.tsx";
import Settings from "../pages/Settings.tsx";
import { Counter } from "../pages/Counter.tsx";
import ServerStatus from "../pages/ServerStatus.tsx";

const routes: RouteObject[] = [
    { path: "/", element: <Navigate to="/home" /> },
    { path: "/home", Component: Home },
    { path: "/settings", Component: Settings },
    { path: "/counter", Component: Counter },
    { path: "/server-status", Component: ServerStatus },
    { path: "*", element: <Navigate to="/" /> },
];

export default routes;
