import authService from "./authService";

const getUsers = async () => {
  return authService.request("/users", {
    method: "GET"
  });
};

const getUser = async (id) => {
  return authService.request(`/users/${id}`, {
    method: "GET"
  });
};

const updateProfile = async (id, profileData) => {
  return authService.request(`/users/${id}/profile`, {
    method: "PATCH",
    body: JSON.stringify(profileData)
  });
};

const updateIdentity = async (id, identityData) => {
  return authService.request(`/users/${id}/identity`, {
    method: "PATCH",
    body: JSON.stringify(identityData)
  });
};

const updatePassword = async (id, passwordData) => {
  return authService.request(`/users/${id}/password`, {
    method: "PUT",
    body: JSON.stringify(passwordData)
  });
};

const deleteUser = async (id) => {
  return authService.request(`/users/${id}`, {
    method: "DELETE"
  });
};

const userService = {
  getUsers,
  getUser,
  updateProfile,
  updateIdentity,
  updatePassword,
  deleteUser
};

export default userService;
