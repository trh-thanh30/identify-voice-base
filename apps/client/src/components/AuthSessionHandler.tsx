import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import { SESSION_EXPIRED_EVENT } from "@/lib/auth-session";
import { getValidAccessToken } from "@/lib/auth-refresh";
import { useAuthStore } from "@/store/auth.store";
import {
  getAccessTokenExpiryMs,
  isAccessTokenExpired,
} from "@/utils/auth-token";

function buildLocationState(location: ReturnType<typeof useLocation>) {
  return {
    from: {
      pathname: `${location.pathname}${location.search}${location.hash}`,
    },
  };
}

export function AuthSessionHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    const handleSessionExpired = () => {
      if (location.pathname === ROUTES.LOGIN) {
        return;
      }

      navigate(ROUTES.LOGIN, {
        replace: true,
        state: buildLocationState(location),
      });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [location, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;

    const refreshAccessToken = async () => {
      try {
        await getValidAccessToken({
          forceRefresh: true,
          reason: "expired",
        });
      } catch {
        if (cancelled) {
          return;
        }
        // Terminal refresh errors already clear the session in shared infrastructure.
      }
    };

    if (!accessToken || isAccessTokenExpired(accessToken, 0)) {
      void refreshAccessToken();
      return () => {
        cancelled = true;
      };
    }

    const expiryMs = getAccessTokenExpiryMs(accessToken);
    if (expiryMs === null) {
      void refreshAccessToken();
      return () => {
        cancelled = true;
      };
    }

    timeoutId = window.setTimeout(
      () => {
        void refreshAccessToken();
      },
      Math.max(expiryMs - Date.now() - 5_000, 0),
    );

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [accessToken, isAuthenticated]);

  return null;
}
