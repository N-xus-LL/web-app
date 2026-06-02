import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { categoryOptions, damagePolicyOptions, itemConditionOptions } from "../constants/referenceData";
import geocodingService from "../services/geocodingService";
import itemService from "../services/itemService";

const emptyItemForm = {
  id: "",
  owner_id: "",
  category_id: "",
  condition_id: "",
  default_damage_policy_id: "",
  name: "",
  description: "",
  images: "",
  latitude: "",
  longitude: "",
  estimated_value: "",
  available: true
};

const getItemLocation = (item) => item.current_location || item.currentLocation || {};

const toItemRequest = (form) => ({
  ...(form.id ? { id: form.id } : {}),
  owner_id: form.owner_id,
  category_id: form.category_id || null,
  condition_id: form.condition_id || null,
  default_damage_policy_id: form.default_damage_policy_id || null,
  name: form.name,
  description: form.description || null,
  images: form.images.split(",").map((image) => image.trim()).filter(Boolean),
  current_location: {
    latitude: Number(form.latitude),
    longitude: Number(form.longitude)
  },
  estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
  available: form.available,
  metadata: {}
});

const ItemForm = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ...emptyItemForm,
    owner_id: currentUser?.user?.id || ""
  });
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const isEdit = Boolean(id);
  const currentUserId = currentUser?.user?.id;
  const canCreate = isEdit
    ? Boolean(currentUserId) && form.id && String(form.owner_id) === String(currentUserId)
    : Boolean(currentUserId);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadItem = async () => {
      setLoading(true);
      setError("");

      try {
        const item = await itemService.getItem(id);
        const ownerId = item.owner_id || item.ownerId || "";

        if (!currentUserId || String(ownerId) !== String(currentUserId)) {
          setError("You can only edit items that belong to you.");
          return;
        }

        const location = getItemLocation(item);
        setForm({
          id: item.id || "",
          owner_id: ownerId,
          category_id: item.category_id || item.categoryId || "",
          condition_id: item.condition_id || item.conditionId || "",
          default_damage_policy_id: item.default_damage_policy_id || item.defaultDamagePolicyId || "",
          name: item.name || "",
          description: item.description || "",
          images: Array.isArray(item.images) ? item.images.join(", ") : "",
          latitude: location.latitude ?? "",
          longitude: location.longitude ?? "",
          estimated_value: item.estimated_value ?? item.estimatedValue ?? "",
          available: Boolean(item.available)
        });
      } catch (requestError) {
        setError(requestError.message || "Failed to load item");
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id, currentUser]);

  const setCoordinates = (latitude, longitude, hint = "") => {
    setForm((current) => ({
      ...current,
      latitude: String(Number(latitude.toFixed(6))),
      longitude: String(Number(longitude.toFixed(6)))
    }));
    setLocationHint(hint || `Coordinates set: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    setError("");
    setLocationHint("");

    try {
      const position = await geocodingService.getCurrentPosition();
      setCoordinates(position.latitude, position.longitude, "Current location applied.");
    } catch (requestError) {
      setError(requestError.message || "Could not get your current location.");
    } finally {
      setLocating(false);
    }
  };

  const handleAddressSearch = async (event) => {
    event.preventDefault();
    setGeocoding(true);
    setError("");
    setLocationHint("");

    try {
      const result = await geocodingService.geocodeAddress(addressQuery);

      if (!result) {
        setError("Address not found. Try a more specific address.");
        return;
      }

      setCoordinates(result.latitude, result.longitude, result.label);
    } catch (requestError) {
      setError(requestError.message || "Address search failed.");
    } finally {
      setGeocoding(false);
    }
  };

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const submitItem = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!currentUserId) {
        throw new Error("You need to be logged in to create an item.");
      }

      if (isEdit && String(form.owner_id) !== String(currentUserId)) {
        throw new Error("You can only edit items that belong to you.");
      }

      if (!form.latitude || !form.longitude) {
        throw new Error("Set a location using your address or current position.");
      }

      const payload = toItemRequest({ ...form, owner_id: currentUserId });

      if (isEdit) {
        await itemService.updateItem(payload);
      } else {
        await itemService.createItem(payload);
      }

      navigate("/items");
    } catch (requestError) {
      setError(requestError.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-section">
      <div className="page-heading page-heading-row">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>{isEdit ? "Edit Item" : "Create Item"}</h1>
        </div>
        <Link className="secondary-button" to="/items">
          Back to items
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!canCreate && (
        <div className="state-panel">
          {isEdit
            ? "You can only edit items that belong to you."
            : "You need to log in before creating an item. The owner is set from the logged-in user."}
        </div>
      )}
      {loading ? (
        <div className="state-panel">Loading item...</div>
      ) : canCreate && (
        <form className="resource-panel item-form-page" onSubmit={submitItem}>
          <div className="form-grid two-columns">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required value={form.name} onChange={handleChange} />
            </div>
            <div className="field location-field-span">
              <label htmlFor="address_search">Address</label>
              <input
                id="address_search"
                placeholder="e.g. Trg Republike 1, Zagreb"
                type="text"
                value={addressQuery}
                onChange={(event) => setAddressQuery(event.target.value)}
              />
            </div>
            <div className="field location-actions">
              <div className="button-row location-button-row">
                <button
                  className="secondary-button small-button"
                  disabled={geocoding || !addressQuery.trim()}
                  type="button"
                  onClick={handleAddressSearch}
                >
                  {geocoding ? "Searching..." : "Find from address"}
                </button>
                <button
                  className="secondary-button small-button"
                  disabled={locating}
                  type="button"
                  onClick={handleUseCurrentLocation}
                >
                  {locating ? "Getting location..." : "Use my location"}
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="latitude">Latitude</label>
              <input id="latitude" name="latitude" readOnly required type="number" step="any" value={form.latitude} />
            </div>
            <div className="field">
              <label htmlFor="longitude">Longitude</label>
              <input id="longitude" name="longitude" readOnly required type="number" step="any" value={form.longitude} />
            </div>
            {locationHint && (
              <p className="location-hint location-field-span">{locationHint}</p>
            )}
            <div className="field">
              <label htmlFor="estimated_value">Estimated value</label>
              <input id="estimated_value" name="estimated_value" type="number" step="any" required value={form.estimated_value} onChange={handleChange} />
            </div>
            <div className="field checkbox-field">
              <label htmlFor="available">Available</label>
              <input id="available" name="available" type="checkbox" checked={form.available} onChange={handleChange} />
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="description">Description</label>
              <input id="description" name="description" required value={form.description} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="images">Image</label>
              <input id="images" name="images" placeholder="Comma separated URLs" value={form.images} onChange={handleChange} />
            </div>
          </div>

          <div className="form-grid three-columns">
            <div className="field">
              <label htmlFor="category_id">Category ID</label>
              <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange}>
                {categoryOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="condition_id">Condition</label>
              <select id="condition_id" name="condition_id" required value={form.condition_id} onChange={handleChange}>
                <option value="">No condition</option>
                {itemConditionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="default_damage_policy_id">Damage policy</label>
              <select id="default_damage_policy_id" name="default_damage_policy_id" required value={form.default_damage_policy_id} onChange={handleChange}>
                <option value="">No policy</option>
                {damagePolicyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="button-row">
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? "Saving..." : isEdit ? "Update item" : "Create item"}
            </button>
            <Link className="secondary-button" to="/items">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </section>
  );
};

export default ItemForm;
