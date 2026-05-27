import authService from "./authService";

const getItems = async () => {
  return authService.request("/items", {
    method: "GET"
  });
};

const itemService = {
  getItems
};

export default itemService;
