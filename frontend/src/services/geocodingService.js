const NOMINATIM_BASE = import.meta.env.VITE_NOMINATIM_BASE_URL || "/nominatim";

const geocodeAddress = async (address) => {
  const query = address.trim();
  if (!query) {
    throw new Error("Enter an address to search.");
  }

  const params = new URLSearchParams({
    format: "json",
    q: query,
    limit: "1"
  });

  const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Address search failed. Try again in a moment.");
  }

  const results = await response.json();
  const match = results?.[0];

  if (!match) {
    return null;
  }

  return {
    latitude: Number(match.lat),
    longitude: Number(match.lon),
    label: match.display_name
  };
};

const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        const messageByCode = {
          1: "Location permission denied. Allow location access in your browser.",
          2: "Your location could not be determined.",
          3: "Location request timed out. Try again."
        };
        reject(new Error(messageByCode[error.code] || "Could not get your current location."));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  });

const reverseGeocode = async (latitude, longitude) => {
  const params = new URLSearchParams({
    format: "json",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18",
    addressdetails: "1"
  });

  const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Could not read the address for this location.");
  }

  const result = await response.json();
  return result?.display_name || "";
};

const watchPosition = (onSuccess, onError) => {
  if (!navigator.geolocation) {
    onError(new Error("Geolocation is not supported in this browser."));
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    },
    (error) => {
      const messageByCode = {
        1: "Location permission denied. Allow location access in your browser.",
        2: "Your location could not be determined.",
        3: "Location request timed out. Try again."
      };
      onError(new Error(messageByCode[error.code] || "Could not get your current location."));
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
};

const geocodingService = {
  geocodeAddress,
  getCurrentPosition,
  reverseGeocode,
  watchPosition
};

export default geocodingService;
