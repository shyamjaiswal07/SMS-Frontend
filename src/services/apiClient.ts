import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { apiEndpoint } from "../appConfig";

type JwtPayload = {
  exp?: number;
};

const apiClient = axios.create({
  baseURL: apiEndpoint.BaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshTokenEndpoint = `${apiEndpoint.BaseUrl}/api/auth/token/refresh/`;

apiClient.interceptors.request.use(
  async (config) => {
    let accessToken = sessionStorage.getItem("accessToken");
    const refresh_token = sessionStorage.getItem("refreshToken");
    const tenantCodeFromStorage = sessionStorage.getItem("tenantCode");
    const tenantFromStorage = sessionStorage.getItem("tenant");
    let tenantCodeFromTenant: string | undefined = undefined;
    if (tenantFromStorage) {
      try {
        tenantCodeFromTenant = (JSON.parse(tenantFromStorage)?.code as string | undefined) ?? undefined;
      } catch {
        tenantCodeFromTenant = undefined;
      }
    }
    const tenantCode = tenantCodeFromStorage ?? tenantCodeFromTenant;

    if (accessToken) {
      const decodedToken = jwtDecode<JwtPayload>(accessToken);
      const currentTime = Date.now() / 1000;

      if ((decodedToken.exp ?? 0) < currentTime && refresh_token) {
        try {
          const response = await axios.post(
            `${refreshTokenEndpoint}`,
            { refresh: refresh_token },
            tenantCode ? { headers: { "X-Org-Code": tenantCode } } : undefined
          );

          const newAccessToken = response.data.access as string;

          sessionStorage.setItem("accessToken", newAccessToken);
          sessionStorage.setItem("refreshToken", refresh_token);

          accessToken = newAccessToken;
        } catch (error) {
          // if refresh fails, let request proceed without auth; route guards will handle
          console.error("Failed to refresh token", error);
        }
      }

      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    if (tenantCode) {
      config.headers = config.headers ?? {};
      config.headers["X-Org-Code"] = tenantCode;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;

