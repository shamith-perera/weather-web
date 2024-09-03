let weatherData;
let locationName;
let queryString;
let tempWeatherData;
let tempLocationName;
let tempQueryString;
let map;
let marker;
const $ = document.getElementById.bind(document);
const searchInput = $("txtSearch");
const suggestionsList = $("dropdownSuggestions");

document.addEventListener("DOMContentLoaded", async () => {
  await loadInitialWeatherData();
  retrieveUserLocation();
  showLoadingScreen();
  adjustSuggestionsListWidth();
});

function retrieveUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await fetchData((queryString = `${position.coords.latitude},${position.coords.longitude}`));
          searchInput.value = locationName = `${weatherData.location.name}, ${weatherData.location.country}`;
          updateWeatherDetails();
        } catch (error) {
          console.log(error);
        }
      },
      (err) => {
        console.log(`ERROR(${err.code}): ${err.message}`);
      }
    );
  }
}

function updateWeatherDetails() {
  $("lblCurrentTemp").innerText = `${Math.round(weatherData.current.temp_c)}°`;
  $("iconCurrentStatus").src = weatherData.current.condition.icon;
  $("lblCurrentStatus").innerText = weatherData.current.condition.text;
  $("lblCurrentFeelslike").innerText = `Feels Like ${Math.round(weatherData.current.feelslike_c)}°`;
  $("lblCurrentTempRange").innerText = `High ${Math.round(weatherData.forecast.forecastday[0].day.maxtemp_c)}° | Low ${Math.round(weatherData.forecast.forecastday[0].day.mintemp_c)}°`;
}

async function fetchData() {
  try {
    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=fd9923cd2bc740a5b2a13313242808&q=${queryString}&days=3&aqi=no&alerts=yes`);
    weatherData = await response.json();
  } catch (error) {
    throw error;
  }
}

function triggerFadeInAnimations() {
  const elements = document.querySelectorAll(".fade-target");
  elements.forEach((element) => {
    element.classList.remove("fade-in");
    void element.offsetWidth;
    element.classList.add("fade-in");
  });
}

async function reloadWeatherData() {
  try {
    await fetchData();
    updateWeatherDetails();
  } catch (error) {
    console.log(error);
  }
}

function initializeMap() {
  map = L.map("map", {
    center: [0, 0],
    zoom: 5,
    minZoom: 2,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  var southWest = L.latLng(-90, -180);
  var northEast = L.latLng(90, 180);
  var bounds = L.latLngBounds(southWest, northEast);

  map.setMaxBounds(bounds);
  map.on("drag", function () {
    map.panInsideBounds(bounds);
  });

  marker = L.marker([0, 0]).addTo(map);
  map.on("click", async function (e) {
    marker.setLatLng(e.latlng);
    try {
      tempQueryString = `${e.latlng.lat},${e.latlng.lng}`;
      const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(tempQueryString)}&days=3&aqi=no&alerts=yes`);
      tempWeatherData = await response.json();
      $("selectedLocationNameInMap").innerText =
        tempLocationName = `${tempWeatherData.location.name}, ${tempWeatherData.location.country}`;
    } catch (error) {
      console.log(error);
    }
  });
}

function showLoadingScreen() {
  document.body.classList.add("no-scroll");
  setTimeout(function () {
    const loadingScreen = $("overlayLoading");
    loadingScreen.classList.add("animationBreakLoading");
    setTimeout(function () {
      loadingScreen.classList.add("display-0");
      document.body.classList.remove("no-scroll");
    });
  }, 100);
}

function adjustSuggestionsListWidth() {
  const inputWidth = searchInput.getBoundingClientRect().width;
  suggestionsList.style.width = `${inputWidth - 10}px`;
}

function hideSuggestions() {
  suggestionsList.innerHTML = "";
  suggestionsList.style.display = "none";
}

function updateMapMarker() {
  let lati = weatherData.location.lat;
  let long = weatherData.location.lon;
  map.setView([lati, long], 5);
  marker.setLatLng([lati, long]);
}

async function loadInitialWeatherData() {
  try {
    const ipResponse = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipResponse.json();
    await fetchData((queryString = ipData.ip));
  } catch (error) {
    try {
      await fetchData((queryString = "id:2842265"));
    } catch (error) {
      console.log(error);
      return;
    }
  }
  searchInput.value = locationName = `${weatherData.location.name}, ${weatherData.location.country}`;
  triggerFadeInAnimations();
  updateWeatherDetails();
}

window.addEventListener("resize", adjustSuggestionsListWidth);

searchInput.addEventListener("click", () => {
  suggestionsList.style.display = "block";
  searchInput.value = "";
});

searchInput.addEventListener("input", async () => {
  const query = searchInput.value;

  if (query.length < 3) {
    suggestionsList.innerHTML = '<li id="suggestionMessage"><i>enter at least 3 characters to see suggestions...</i></li>';
    return;
  }
  suggestionsList.style.display = "block";
  try {
    const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(query)}`);
    const suggestions = await response.json();
    if (suggestions.length == 0) {
      suggestionsList.innerHTML = `<li id="suggestionMessage"><i>no suggestions...</i></li>`;
      return;
    }
    suggestionsList.innerHTML = suggestions.map((suggestion) =>
      `<li id="id:${suggestion.id}">${suggestion.name}, ${suggestion.country}</li>`
    ).join("");

    suggestionsList.querySelectorAll("li").forEach((item) => {
      item.addEventListener("click", async () => {
        searchInput.value = locationName = item.textContent;
        hideSuggestions();
        try {
          await fetchData((queryString = item.id));
          triggerFadeInAnimations();
          updateWeatherDetails();
        } catch (error) {
          console.log(error);
        }
      });
    });
  } catch (error) {
    console.log(error);
    suggestionsList.innerHTML = '<li id="suggestionMessage">Error fetching suggestions</li>';
  }
});

document.addEventListener("click", (event) => {
  if (suggestionsList.style.display == "block" && !searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
    searchInput.value = locationName;
    hideSuggestions();
  }
});
$("overlayLocationPicker").addEventListener("click", (event) => {
  if (!$("formLocationPicker").contains(event.target)) {
    hideLocationPicker();
  }
});

$("btnLocationPicker").addEventListener("click", () => {
  $("overlayLocationPicker").style.display = "flex";
  if (map) {
    map.remove();
  }
  initializeMap();
  $("selectedLocationNameInMap").innerText = locationName;
  updateMapMarker();
});

$("btnSelect").addEventListener("click", () => {
  hideLocationPicker();
  queryString = tempQueryString;
  searchInput.value = locationName = tempLocationName;
  weatherData = tempWeatherData;
  triggerFadeInAnimations();
  updateWeatherDetails();
});

$("btnCloseLocationPicker").addEventListener("click", () => {
  hideLocationPicker();
});

function hideLocationPicker() {
  $("overlayLocationPicker").style.display = "none";
}
