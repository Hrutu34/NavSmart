let poiMarkers = [];

const POI_TYPES = {
  DELICACIES: ["restaurant", "cafe", "bakery"],
  SIGHTSEEING: ["tourist_attraction", "museum", "park"],
  RESTING: ["lodging", "gas_station", "petrol_pump", "rest_stop"],
};

const POI_ICONS = {
  DELICACIES: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
  SIGHTSEEING: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  RESTING: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
};

/**
 * 1. Fetch user browser location
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * 2. Populate Delicacies, Sightseeing, or Resting Places near a location
 */
export function populatePOIs(mapInstance, location, category = "DELICACIES", radius = 3000) {
  if (!mapInstance || !location) return;

  const service = new google.maps.places.PlacesService(mapInstance);
  const types = POI_TYPES[category] || POI_TYPES.DELICACIES;

  service.nearbySearch(
    {
      location: new google.maps.LatLng(location.lat, location.lng),
      radius: radius,
      type: types,
    },
    (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        results.forEach((place) => {
          const marker = new google.maps.Marker({
            map: mapInstance,
            position: place.geometry.location,
            title: place.name,
            icon: POI_ICONS[category],
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="font-family: inherit; padding: 2px;">
                <strong>${place.name}</strong>
                <p style="margin: 2px 0 0; font-size: 12px;">⭐ ${place.rating || "N/A"} (${place.user_ratings_total || 0})</p>
                <p style="margin: 2px 0 0; font-size: 11px; color: #666;">${place.vicinity || ""}</p>
              </div>
            `,
          });

          marker.addListener("click", () => infoWindow.open(mapInstance, marker));
          poiMarkers.push(marker);
        });
      }
    }
  );
}

/**
 * 3. Clear active POIs without resetting route overlays
 */
export function clearPOIMarkers() {
  poiMarkers.forEach((marker) => marker.setMap(null));
  poiMarkers = [];
}