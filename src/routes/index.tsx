import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import App from "../App";
import SuperAdminDashboard from "../components/SuperAdminDashboard";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "../components/ProtectedRoute";
import Signup from "../pages/Signup";
import Login from "../pages/Login";
import FileManager from "../pages/FileManager";
import MemberManager from "../pages/MemberManager";
import Success from "../pages/Success";
import Cancel from "../pages/Cancel";

const routes = createBrowserRouter([
    // ── With Layout ──────────────────────────────────────
    {
        path: "/",
        element: <Layout />,
        children: [
            { path: "/", element: <App /> },
            { path: "/login", element: <Login /> },
            { path: "/signup", element: <Signup /> },
            { path: "/success", element: <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "MEMBER"]}><Success /></ProtectedRoute> },
            { path: "/cancel", element: <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "MEMBER"]}><Cancel /></ProtectedRoute> },
            {
                path: "/dashboard",
                element: (
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                        <SuperAdminDashboard />
                    </ProtectedRoute>
                ),
            },
        ],
    },

    // ── Without Layout ────────────────────────────────────
    {
        path: "/files",
        element: (
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "MEMBER"]}>
                <FileManager />
            </ProtectedRoute>
        ),
    },
    {
        path: "/members",
        element: (
            <ProtectedRoute allowedRoles={["OWNER"]}>
                <MemberManager />
            </ProtectedRoute>
        ),
    },

    { path: "*", element: <NotFound /> },
]);

export default routes;