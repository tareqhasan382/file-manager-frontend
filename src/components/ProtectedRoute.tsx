import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../Redux/store";
import { userLoggedOut } from "../Redux/authSlice";
import { BASE_URL } from "../App";
import type { JSX } from "react";

type Props = {
  children: JSX.Element;
  allowedRoles?: string[]; // reusable
};

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const [validating, setValidating] = useState(!!accessToken);

  // Validate the session against the DB. A token alone is not enough — the
  // user must still exist (not deleted/banned), otherwise we log out.
  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;
    const validate = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
          headers: { Authorization: accessToken },
        });
        if (!res.ok) {
          dispatch(userLoggedOut());
          if (!cancelled) navigate("/login", { replace: true });
        } else if (
          allowedRoles &&
          user &&
          !allowedRoles.includes(user.role)
        ) {
          if (!cancelled) navigate("/", { replace: true });
        }
      } catch {
        dispatch(userLoggedOut());
        if (!cancelled) navigate("/login", { replace: true });
      } finally {
        if (!cancelled) setValidating(false);
      }
    };
    validate();

    return () => {
      cancelled = true;
    };
  }, [accessToken, navigate, dispatch, allowedRoles, user]);

  // Not logged in
  if (!accessToken) return null;

  // Waiting for the session check (prevents protected-content flash)
  if (validating) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-600 text-sm">Checking session...</p>
        </div>
      </div>
    );
  }

  // Role based check (Admin)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
