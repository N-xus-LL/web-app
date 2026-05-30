import authService from "./authService";

const getItems = async () => {
  return authService.request("/items", {
    method: "GET"
  });
};

const getNearbyItems = async ({ lat, lon, radius }) => {
  return authService.request(`/items/nearby?lat=${lat}&lon=${lon}&radius=${radius}`, {
    method: "GET"
  });
};

const getClosestItem = async ({ lat, lon }) => {
  return authService.request(`/items/closest?lat=${lat}&lon=${lon}`, {
    method: "GET"
  });
};

const getItem = async (id) => {
  return authService.request(`/items/${id}`, {
    method: "GET"
  });
};

const createItem = async (itemData) => {
  return authService.request("/items", {
    method: "POST",
    body: JSON.stringify(itemData)
  });
};

const updateItem = async (itemData) => {
  return authService.request("/items", {
    method: "PUT",
    body: JSON.stringify(itemData)
  });
};

const deleteItem = async (id) => {
  return authService.request(`/items/${id}`, {
    method: "DELETE"
  });
};

const getUserItems = async (id) => {
  return authService.request(`/items/user/${id}`, {
    method: "GET"
  });
};

const itemService = {
  getItems,
  getNearbyItems,
  getClosestItem,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getUserItems
};

export default itemService;
