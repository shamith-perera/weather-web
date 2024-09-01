
let currentLocationData;
let currentLocationName;
let map;
let marker;
let fetchQuery;
const $ = document.getElementById.bind(document);
const searchInput = $('searchInput');
const suggestionsList = $('suggestionsList');

document.addEventListener('DOMContentLoaded', async () => {
    await loadDefaultLocationData();
    startLoadingAnimation();
    adjustSuggestionsListWidth();
    askForLocation();
});

function askForLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await fetchData(fetchQuery = `${position.coords.latitude},${position.coords.longitude}`);
                    searchInput.value = currentLocationName = `${currentLocationData.location.name}, ${currentLocationData.location.country}`;
                    updateDetails();
                    playResettingAnimations();
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

function updateDetails() {
    $('currentTemp').innerText = `${Math.round(currentLocationData.current.temp_c)}°`;
    $('currentCondtionIcon').src = currentLocationData.current.condition.icon;
    $('currentStatusText').innerText = currentLocationData.current.condition.text;
    $('currentFeelsLikeText').innerText = `Feels Like ${Math.round(currentLocationData.current.feelslike_c)}°`;
    $('highAndLowTemp').innerText = `High ${Math.round(currentLocationData.forecast.forecastday[0].day.maxtemp_c)}° | Low ${Math.round(currentLocationData.forecast.forecastday[0].day.mintemp_c)}°`;
}

async function fetchData() {
    try {
        const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=fd9923cd2bc740a5b2a13313242808&q=${fetchQuery}&days=3&aqi=no&alerts=yes`);
        currentLocationData = await response.json();
    } catch (error) {
        throw error;
    }

}

function playResettingAnimations() {
    const elements = document.querySelectorAll('.fade-target');
    elements.forEach(element => {
        element.classList.remove('fade-in');
        void element.offsetWidth;
        element.classList.add('fade-in');
    });
}



async function refreshData() {
    try {
        await fetchData();
        updateDetails();
    } catch (error) {
        console.log(error);
    }
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
        try {
            await fetchData(fetchQuery = `${e.latlng.lat},${e.latlng.lng}`);
            $('selectedLocationNameInMap').innerText = currentLocationName = `${currentLocationData.location.name}, ${currentLocationData.location.country}`;
        } catch (error) {
            console.log(error);
        }
    });
}

function startLoadingAnimation() {
    document.body.classList.add('no-scroll');
    setTimeout(function () {
        const loadingScreen = $('loading-screen');
        loadingScreen.classList.add('break-animation');
        setTimeout(function () {
            loadingScreen.classList.add('hidden');
            document.body.classList.remove('no-scroll');
        });
    }, 100);
}

function adjustSuggestionsListWidth() {
    const inputWidth = searchInput.getBoundingClientRect().width;
    suggestionsList.style.width = `${inputWidth - 10}px`;
}

function closeSuggestions() {
    suggestionsList.innerHTML = '';
    suggestionsList.style.display = 'none';
}

function placeMapMarker() {
    let lati = currentLocationData.location.lat;
    let long = currentLocationData.location.lon;
    map.setView([lati, long], 5);
    marker.setLatLng([lati, long]);
}

async function loadDefaultLocationData() {
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        await fetchData(fetchQuery = ipData.ip);
    } catch (error) {
        try {
            await fetchData(fetchQuery = "id:2842265");
        } catch (error) {
            console.log(error);
            return;
        }

    }
    searchInput.value = currentLocationName = `${currentLocationData.location.name}, ${currentLocationData.location.country}`;
    playResettingAnimations();
    updateDetails();
}

window.addEventListener('resize', adjustSuggestionsListWidth);

searchInput.addEventListener('click', () => {
    searchInput.value = '';
})

searchInput.addEventListener('input', async () => {
    const query = searchInput.value;

    if (query.length == 0) {
        closeSuggestions();
        return;
    }
    suggestionsList.style.display = 'block';
    try {
        const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(query)}`);
        const suggestions = await response.json();
        if (suggestions.length == 0) {
            suggestionsList.innerHTML = `<li><i>no suggestions...</i></li>`;
            return;
        }
        suggestionsList.innerHTML = suggestions.map(suggestion =>
            `<li id="id:${suggestion.id}">${suggestion.name}, ${suggestion.country}</li>`
        ).join('');


        suggestionsList.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', async () => {
                searchInput.value = (currentLocationName = item.textContent);
                closeSuggestions();
                try {
                    await fetchData(fetchQuery = item.id);
                    playResettingAnimations();
                    updateDetails();
                } catch (error) {
                    console.log(error);
                }

            });
        });

    } catch (error) {
        console.log(error);
        suggestionsList.innerHTML = '<li>Error fetching suggestions</li>';
    }
});


document.addEventListener('click', (event) => {
    if (suggestionsList.style.display == 'block' && !searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
        searchInput.value = currentLocationName;
        closeSuggestions();
    }
});

document.getElementById('btnLocationSelector').addEventListener('click', () => {
    $('popup-overlay').style.display = 'flex';
    if (map) {
        map.remove();
    }
    initMap();
    $('selectedLocationNameInMap').innerText = currentLocationName;
    placeMapMarker();
});

document.getElementById('btnSelect').addEventListener('click', () => {
    $('popup-overlay').style.display = 'none';
    playResettingAnimations();
    searchInput.value = currentLocationName;
    updateDetails();
})







