let directionsService;
let directionsRenderer;

export function initDirections(mapInstance) {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: mapInstance,
    suppressMarkers: false,
  });
}

/**
 * Calculate multi-stop route and structured itinerary breakdown
 */
export function calculateItineraryWithStops(origin, destination, stops = []) {
  return new Promise((resolve, reject) => {
    if (!directionsService || !directionsRenderer) {
      reject(new Error("Directions service not initialized."));
      return;
    }

    const waypoints = stops
      .filter((s) => s && s.trim() !== "")
      .map((stop) => ({
        location: stop,
        stopover: true,
      }));

    const request = {
      origin: origin,
      destination: destination,
      waypoints: waypoints,
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);

        const route = result.routes[0];
        const itinerary = route.legs.map((leg, index) => ({
          legNumber: index + 1,
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          startLocation: { lat: leg.start_location.lat(), lng: leg.start_location.lng() },
          endLocation: { lat: leg.end_location.lat(), lng: leg.end_location.lng() },
          distance: leg.distance.text,
          duration: leg.duration.text,
        }));

        resolve(itinerary);
      } else {
        reject(new Error(`Directions failed: ${status}`));
      }
    });
  });
}