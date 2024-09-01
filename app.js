let currentLocationData;
let currentLocationName;
let currentLocationId;
let map;
let marker;
let lati;
let long;

function updateDetails() {
    const elements = document.querySelectorAll('.fade-target');
    elements.forEach(element => {
        element.classList.remove('fade-in');
        void element.offsetWidth;
        element.classList.add('fade-in');
    });

    document.getElementById('currentTemp').innerText = Math.round(currentLocationData.current.temp_c) + "°";
    document.getElementById('currentCondtionIcon').src = currentLocationData.current.condition.icon;
    document.getElementById('currentStatusText').innerText = currentLocationData.current.condition.text;
    document.getElementById('currentFeelsLikeText').innerText = "Feels Like " + Math.round(currentLocationData.current.feelslike_c) + "°";
    document.getElementById('highAndLowTemp').innerText = "High " + Math.round(currentLocationData.forecast.forecastday[0].day.maxtemp_c) + "° | Low " + Math.round(currentLocationData.forecast.forecastday[0].day.mintemp_c) + "°";
}

function initMap() {

    map = L.map('map', {
        center: [0, 0],
        zoom: 5,
        minZoom: 2,
    });



    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var southWest = L.latLng(-90, -180);
    var northEast = L.latLng(90, 180);
    var bounds = L.latLngBounds(southWest, northEast);


    map.setMaxBounds(bounds);
    map.on('drag', function () {
        map.panInsideBounds(bounds);
    });

    marker = L.marker([0, 0]).addTo(map);
    map.on('click', async function (e) {
        marker.setLatLng(e.latlng);
        const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(e.latlng.lat)},${encodeURIComponent(e.latlng.lng)}&days=3&aqi=no&alerts=yes`);
        let tempResponse = await response.json();
        if (tempResponse.location == null) {
            return;
        }
        currentLocationData = tempResponse;
        currentLocationName = currentLocationData.location.name + ", " + currentLocationData.location.country;
        document.getElementById('selectedLocationNameInMap').innerText = currentLocationName;
    });
}
document.addEventListener('DOMContentLoaded', async () => {
    document.body.classList.add('no-scroll');


    setTimeout(function () {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('break-animation');
        setTimeout(function () {
            loadingScreen.classList.add('hidden');
            document.body.classList.remove('no-scroll');
        });
    }, 1000);

    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestionsList');



    currentLocationId = "id:" + 2842265;
    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(currentLocationId)}&days=3&aqi=no&alerts=yes`);
    currentLocationData = await response.json();
    lati = currentLocationData.location.lat;
    long = currentLocationData.location.lon;
    currentLocationName = currentLocationData.location.name + ", " + currentLocationData.location.country;
    searchInput.value = currentLocationName;
    updateDetails();


    function adjustSuggestionsListWidth() {
        const inputWidth = searchInput.getBoundingClientRect().width;
        suggestionsList.style.width = `${inputWidth - 10}px`;
    }

    function closeSuggestions() {
        suggestionsList.innerHTML = '';
        suggestionsList.style.display = 'none';
    }

    adjustSuggestionsListWidth();
    window.addEventListener('resize', adjustSuggestionsListWidth);

    searchInput.addEventListener('click', () => {
        searchInput.value = '';
    })

    searchInput.addEventListener('input', async () => {
        const query = searchInput.value;

        if (query.length < 3) {
            closeSuggestions();
            return;
        }
        suggestionsList.style.display = 'block';
        try {
            const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(query)}`);
            const suggestions = await response.json();
            if (suggestions.length == 0) {
                suggestionsList.innerHTML = `<li>Location Not Found</li>`;
                return;
            }
            suggestionsList.innerHTML = suggestions.map(suggestion =>
                `<li id=${"id:" + suggestion.id}>${suggestion.name + ", " + suggestion.country}</li>`
            ).join('');


            suggestionsList.querySelectorAll('li').forEach(item => {
                item.addEventListener('click', async () => {
                    currentLocationName = item.textContent;
                    currentLocationId = item.id;
                    searchInput.value = currentLocationName;
                    closeSuggestions();
                    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(currentLocationId)}&days=3&aqi=no&alerts=yes`);
                    currentLocationData = await response.json();
                    updateDetails();
                });
            });

        } catch (error) {
            console.error('Error fetching suggestions:', error);
            suggestionsList.innerHTML = '<li>Error fetching suggestions</li>';
        }
    });


    document.addEventListener('click', (event) => {
        if (!searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
            searchInput.value = currentLocationName;
            closeSuggestions();
        }
    });

    document.getElementById('btnLocationSelector').addEventListener('click', () => {
        document.getElementById('popup-overlay').style.display = 'flex';
        if (map) {
            map.remove();
        }
        initMap();
        document.getElementById('selectedLocationNameInMap').innerText = currentLocationName;
        placeMapMarker();
    });

    document.getElementById('btnClose').addEventListener('click', () => {
        document.getElementById('popup-overlay').style.display = 'none';
        updateDetails();

    }

    )
});

function placeMapMarker() {
    lati = currentLocationData.location.lat;
    long = currentLocationData.location.lon;
    map.setView([lati, long], 5);
    marker.setLatLng([lati, long]);
}



