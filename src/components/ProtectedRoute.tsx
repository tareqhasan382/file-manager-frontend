import { useEffect } from "react";
// import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
// import type { RootState } from "../Redux/store";
import type { JSX } from "react";

type Props = {
  children: JSX.Element;
  allowedRoles?: string[]; // reusable
};

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const navigate = useNavigate();
  //const { accessToken, user } = useSelector((state: RootState) => state.auth);
 let accessToken
 const user={
    role:"admin"
 }
  useEffect(() => {
    // Not logged in
    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }

    // Role based check (Admin)
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      navigate("/", { replace: true }); // or /jobs
    }
  }, [accessToken, user, allowedRoles, navigate]);

  // Prevent flicker
  if (!accessToken) return null;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return children;
};

export default ProtectedRoute;