/* eslint-disable */

// Topic: Logging in Users with Our API - Part 3
export const displayMap = (locations) => {
  const map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    closePopupOnClick: false,
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    crossOrigin: '',
  }).addTo(map);

  const points = [];
  locations.forEach((loc) => {
    const latlng = loc.coordinates.reverse();
    points.push(latlng);
    L.marker(latlng)
      .addTo(map)
      .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
        autoClose: false,
        autoPan: false,
      })
      .openPopup();
  });

  const bounds = L.latLngBounds(points).pad(0.2);
  map.fitBounds(bounds);
};
