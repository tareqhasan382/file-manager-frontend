import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import App from "../App";
import SuperAdminDashboard from "../components/SuperAdminDashboard";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "../components/ProtectedRoute";
import Signup from "../pages/Signup";
import Login from "../pages/Login";

const routes = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                path: "/",
                element: (
                    <App />
                ),
            },
            {
                path: "/login",
                element: (

                    <Login />

                ),
            },
            {
                path: "/signup",
                element: (

                    <Signup />

                ),
            },
             {
                path: "/dashboard",
                element: (

                    <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                        <SuperAdminDashboard />
                    </ProtectedRoute>

                ),
            },
            
            //  {
            //     path: "/jobs/:id",
            //     element: (

            //         <JobsDetails />

            //     ),
            // },

            {
                path: "*",
                element: <NotFound />,
            },
        ],
    },
]);
export default routes;