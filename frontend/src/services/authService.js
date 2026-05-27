const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const AUTH_STORAGE_KEY = "lendloop_auth";

const getCurrentUser = () => {
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    logout();
    return null;
  }
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
};

const request = async (path, options = {}) => {
  const currentUser = getCurrentUser();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}),
      ...options.headers
    }
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || data?.debug_error || "Request failed");
  }

  return data;
};

const register = async (userData) => {
  return request("/users/register", {
    method: "POST",
    body: JSON.stringify(userData)
  });
};

const login = async (credentials) => {
  const data = await request("/users/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });

  if (data?.token) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  }

  return data;
};

const updateStoredUser = (userUpdates) => {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const updatedUser = {
    ...currentUser,
    user: {
      ...currentUser.user,
      ...userUpdates
    }
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
  return updatedUser;
};

const logout = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

const authService = {
  request,
  register,
  login,
  updateStoredUser,
  logout,
  getCurrentUser
};

export default authService;
