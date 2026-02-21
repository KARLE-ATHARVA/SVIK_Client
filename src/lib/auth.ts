// lib/auth.ts
export const getToken = () => {
  if (typeof window === "undefined") return null;
  // sessionStorage clears automatically when the tab/window is closed
  return sessionStorage.getItem("pgatoken");
};

export const isLoggedIn = () => {
  return !!getToken();
};

export const logout = () => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("pgatoken");
    window.location.reload(); 
  }
};