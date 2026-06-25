import Cookies from "js-cookie";

export function saveTokens(accessToken: string, refreshToken: string) {
  Cookies.set("accessToken", accessToken, { expires: 1, sameSite: "strict" });
  Cookies.set("refreshToken", refreshToken, { expires: 7, sameSite: "strict" });
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  Cookies.remove("accessToken");
  Cookies.remove("refreshToken");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("adminUser");
}

export function getAccessToken(): string | null {
  return Cookies.get("accessToken") || localStorage.getItem("accessToken");
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function saveAdminUser(user: any) {
  localStorage.setItem("adminUser", JSON.stringify(user));
}

export function getAdminUser(): any | null {
  try {
    const s = localStorage.getItem("adminUser");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
