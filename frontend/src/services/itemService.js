import authService from "./authService";

export const ITEM_DATA_CHANGED_EVENT = "lendloop:item-data-changed";

const notifyItemDataChanged = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(ITEM_DATA_CHANGED_EVENT));
  localStorage.setItem("lendloop_item_data_changed_at", String(Date.now()));
};

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
  const created = await authService.request("/items", {
    method: "POST",
    body: JSON.stringify(itemData)
  });

  notifyItemDataChanged();
  return created;
};

const updateItem = async (itemData) => {
  const updated = await authService.request("/items", {
    method: "PUT",
    body: JSON.stringify(itemData)
  });

  notifyItemDataChanged();
  return updated;
};

const deleteItem = async (id) => {
  const deleted = await authService.request(`/items/${id}`, {
    method: "DELETE"
  });

  notifyItemDataChanged();
  return deleted;
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
