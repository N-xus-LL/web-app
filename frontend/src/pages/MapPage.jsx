import React from "react";

const MapPage = () => {
  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">Locations</p>
        <h1>Map</h1>
      </div>

      <div className="map-placeholder">
        <div className="map-pin pin-one" />
        <div className="map-pin pin-two" />
        <div className="map-pin pin-three" />
        <div className="map-card">
          <h2>Map view placeholder</h2>
          <p>Connect a map library here when the location UI is next in scope.</p>
        </div>
      </div>
    </section>
  );
};

export default MapPage;
