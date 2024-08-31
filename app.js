let currentLocationData;
let currentLocationName;
let currentLocationId;
let map;
let marker;

function updateDetails(){
    const elements = document.querySelectorAll('.fade-target'); 
    elements.forEach(element => {
        element.classList.remove('fade-in');
        void element.offsetWidth;
        element.classList.add('fade-in');
    });

    document.getElementById('currentTemp').innerText = Math.round(currentLocationData.current.temp_c) + "°";
    document.getElementById('currentCondtionIcon').src = currentLocationData.current.condition.icon;
    document.getElementById('currentStatusText').innerText = currentLocationData.current.condition.text;
    document.getElementById('currentFeelsLikeText').innerText = "Feels Like " + Math.round(currentLocationData.current.feelslike_c)+"°";
    document.getElementById('highAndLowTemp').innerText = "High " + Math.round(currentLocationData.forecast.forecastday[0].day.maxtemp_c) + "° | Low " + Math.round(currentLocationData.forecast.forecastday[0].day.mintemp_c) + "°";
}

function initMap() {
   
    map = L.map('map').setView([51.505, -0.09], 13); 

    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    
    map.on('click', function(e) {
        if (marker) {
            marker.setLatLng(e.latlng); 
        } else {
            marker = L.marker(e.latlng).addTo(map); 
        }
        console.log(`Selected location: ${e.latlng.lat}, ${e.latlng.lng}`);
    });
}
document.addEventListener('DOMContentLoaded', async () => {

initMap();  

    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestionsList');
    
    currentLocationId = "id:"+2842265;
    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(currentLocationId)}&days=3&aqi=no&alerts=yes`);
    currentLocationData = await response.json();
    currentLocationName =currentLocationData.location.name + ", " + currentLocationData.location.country;
    searchInput.value = currentLocationName;
    updateDetails();
   
    function adjustSuggestionsListWidth() {
        const inputWidth = searchInput.getBoundingClientRect().width;
        suggestionsList.style.width = `${inputWidth - 10}px`;
    }

    function closeSuggestions(){
        suggestionsList.innerHTML = '';
        suggestionsList.style.display = 'none';
    }

    adjustSuggestionsListWidth();
    window.addEventListener('resize', adjustSuggestionsListWidth);

    searchInput.addEventListener('click',  () => {
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
                suggestionsList.innerHTML =  `<li>Location Not Found</li>`;
                return;
            }
            suggestionsList.innerHTML = suggestions.map(suggestion =>
                `<li id=${"id:" + suggestion.id}>${suggestion.name + ", " + suggestion.country}</li>`
            ).join('');


            suggestionsList.querySelectorAll('li').forEach(item => {
                item.addEventListener('click', async () => {
                    currentLocationName =item.textContent;
                    currentLocationId = item.id;
                    searchInput.value = currentLocationName;
                    closeSuggestions();
                    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(currentLocatioId)}&days=3&aqi=no&alerts=yes`);
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

    document.getElementById('btnLocationSelector').addEventListener('click',() => {
        document.getElementById('popup-overlay').style.display = 'flex';       
    });

    document.getElementById('btnClose').addEventListener('click',() => {
        document.getElementById('popup-overlay').style.display = 'none';
           
    }

    )
});



