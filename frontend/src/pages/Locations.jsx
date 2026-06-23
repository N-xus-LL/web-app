import React, { useEffect, useState } from "react";
import locationService from "../services/locationService";

const emptyLocationForm = {
  id: "",
  name: "",
  location_type: "",
  source: "",
  latitude: "",
  longitude: ""
};

const emptyGeoQuery = {
  lat: "",
  lon: "",
  radius: "5"
};

const toLocationRequest = (form) => ({
  name: form.name,
  location_type: form.location_type || null,
  source: form.source || null,
  location: {
    latitude: Number(form.latitude),
    longitude: Number(form.longitude)
  },
  metadata: {}
});

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(emptyLocationForm);
  const [geoQuery, setGeoQuery] = useState(emptyGeoQuery);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadLocations = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await locationService.getLocations();
      setLocations(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const clearStatus = () => {
    setError("");
    setMessage("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleGeoChange = (event) => {
    const { name, value } = event.target;
    setGeoQuery((current) => ({ ...current, [name]: value }));
  };

  const editLocation = (location) => {
    setSelectedLocation(location);
    setForm({
      id: location.id || "",
      name: location.name || "",
      location_type: location.location_type || location.locationType || "",
      source: location.source || "",
      latitude: location.location?.latitude ?? "",
      longitude: location.location?.longitude ?? ""
    });
  };

  const resetForm = () => {
    setForm(emptyLocationForm);
    setSelectedLocation(null);
  };

  const submitLocation = async (event) => {
    event.preventDefault();
    clearStatus();
    setSaving("location");

    try {
      if (form.id) {
        await locationService.updateLocation(form.id, toLocationRequest(form));
        setMessage("Location updated.");
      } else {
        await locationService.createLocation(toLocationRequest(form));
        setMessage("Location created.");
      }
      resetForm();
      await loadLocations();
    } catch (requestError) {
      setError(requestError.message || "Failed to save location");
    } finally {
      setSaving("");
    }
  };

  const viewLocation = async (id) => {
    clearStatus();
    setSaving(`view-${id}`);

    try {
      const location = await locationService.getLocation(id);
      setSelectedLocation(location);
      setMessage(`Loaded location: ${location.name}`);
    } catch (requestError) {
      setError(requestError.message || "Failed to load location");
    } finally {
      setSaving("");
    }
  };

  const deleteLocation = async (id) => {
    if (!window.confirm("Delete this location?")) {
      return;
    }

    clearStatus();
    setSaving(`delete-${id}`);

    try {
      await locationService.deleteLocation(id);
      setMessage("Location deleted.");
      await loadLocations();
    } catch (requestError) {
      setError(requestError.message || "Failed to delete location");
    } finally {
      setSaving("");
    }
  };

  const loadNearby = async (event) => {
    event.preventDefault();
    clearStatus();
    setSaving("nearby");

    try {
      const response = await locationService.getNearbyLocations(geoQuery);
      setLocations(Array.isArray(response) ? response : []);
      setMessage("Nearby locations loaded.");
    } catch (requestError) {
      setError(requestError.message || "Failed to load nearby locations");
    } finally {
      setSaving("");
    }
  };

  const loadClosest = async () => {
    clearStatus();
    setSaving("closest");

    try {
      const location = await locationService.getClosestLocation(geoQuery);
      setLocations(location ? [location] : []);
      setSelectedLocation(location);
      setMessage("Closest location loaded.");
    } catch (requestError) {
      setError(requestError.message || "Failed to load closest location");
    } finally {
      setSaving("");
    }
  };

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">Spatial data</p>
        <h1>Locations</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="resource-layout">
        <div>
          <form className="resource-panel" onSubmit={submitLocation}>
            <div className="panel-heading">
              <h2>{form.id ? "Edit location" : "Create location"}</h2>
              {form.id && <button className="link-button" type="button" onClick={resetForm}>New location</button>}
            </div>
            <div className="form-grid two-columns">
              <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" required value={form.name} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="location_type">Type</label>
                <input id="location_type" name="location_type" value={form.location_type} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="latitude">Latitude</label>
                <input id="latitude" name="latitude" required type="number" step="any" value={form.latitude} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="longitude">Longitude</label>
                <input id="longitude" name="longitude" required type="number" step="any" value={form.longitude} onChange={handleChange} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="source">Source</label>
              <input id="source" name="source" value={form.source} onChange={handleChange} />
            </div>
            <button className="primary-button" disabled={saving === "location"} type="submit">
              {saving === "location" ? "Saving..." : form.id ? "Update location" : "Create location"}
            </button>
          </form>

          <form className="resource-panel compact-panel" onSubmit={loadNearby}>
            <div className="panel-heading">
              <h2>Nearby and closest</h2>
              <button className="link-button" type="button" onClick={loadLocations}>Reset list</button>
            </div>
            <div className="form-grid three-columns">
              <div className="field">
                <label htmlFor="location-lat">Lat</label>
                <input id="location-lat" name="lat" required type="number" step="any" value={geoQuery.lat} onChange={handleGeoChange} />
              </div>
              <div className="field">
                <label htmlFor="location-lon">Lon</label>
                <input id="location-lon" name="lon" required type="number" step="any" value={geoQuery.lon} onChange={handleGeoChange} />
              </div>
              <div className="field">
                <label htmlFor="location-radius">Radius</label>
                <input id="location-radius" name="radius" required type="number" step="any" value={geoQuery.radius} onChange={handleGeoChange} />
              </div>
            </div>
            <div className="button-row">
              <button className="secondary-button" disabled={saving === "nearby"} type="submit">Nearby</button>
              <button className="secondary-button" disabled={saving === "closest"} type="button" onClick={loadClosest}>Closest</button>
            </div>
          </form>
        </div>

        <div>
          {loading && <div className="state-panel">Loading locations...</div>}
          {!loading && locations.length === 0 && <div className="state-panel">No locations found.</div>}
          {!loading && locations.length > 0 && (
            <div className="simple-list">
              {locations.map((location) => (
                <article className="list-row" key={location.id}>
                  <div>
                    <h2>{location.name}</h2>
                    <p>{location.location_type || location.locationType || "No type"} · {location.source || "No source"}</p>
                    <span>{location.id}</span>
                  </div>
                  <div className="button-row">
                    <button className="secondary-button small-button" type="button" onClick={() => viewLocation(location.id)}>View</button>
                    <button className="secondary-button small-button" type="button" onClick={() => editLocation(location)}>Edit</button>
                    <button className="danger-button small-button" type="button" onClick={() => deleteLocation(location.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {selectedLocation && (
            <div className="resource-panel detail-panel">
              <h2>Selected location</h2>
              <pre>{JSON.stringify(selectedLocation, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Locations;
