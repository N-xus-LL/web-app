import authService from "./authService";

const getLocations = async () => {
  return authService.request("/locations", {
    method: "GET"
  });
};

const getNearbyLocations = async ({ lat, lon, radius }) => {
  return authService.request(`/locations/nearby?lat=${lat}&lon=${lon}&radius=${radius}`, {
    method: "GET"
  });
};

const getClosestLocation = async ({ lat, lon }) => {
  return authService.request(`/locations/closest?lat=${lat}&lon=${lon}`, {
    method: "GET"
  });
};

const getLocation = async (id) => {
  return authService.request(`/locations/${id}`, {
    method: "GET"
  });
};

const createLocation = async (locationData) => {
  return authService.request("/locations", {
    method: "POST",
    body: JSON.stringify(locationData)
  });
};

const updateLocation = async (id, locationData) => {
  return authService.request(`/locations?id=${id}`, {
    method: "PUT",
    body: JSON.stringify(locationData)
  });
};

const deleteLocation = async (id) => {
  return authService.request(`/locations/${id}`, {
    method: "DELETE"
  });
};

const locationService = {
  getLocations,
  getNearbyLocations,
  getClosestLocation,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation
};

export default locationService;
