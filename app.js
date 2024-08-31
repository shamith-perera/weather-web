let currentLocatioData;
let currentLocationName;
let currentLocatioId;

function updateDetails(){
    const elements = document.querySelectorAll('.fade-target'); 
    elements.forEach(element => {
        element.classList.remove('fade-in');
        void element.offsetWidth;
        element.classList.add('fade-in');
    });

    document.getElementById('currentTemp').innerText = Math.round(currentLocatioData.current.temp_c) + "°";
    document.getElementById('currentCondtionIcon').src = currentLocatioData.current.condition.icon;
    document.getElementById('currentStatusText').innerText = currentLocatioData.current.condition.text;
    document.getElementById('currentFeelsLikeText').innerText = "Feels Like " + Math.round(currentLocatioData.current.feelslike_c)+"°";
    document.getElementById('highAndLowTemp').innerText = "High " + Math.round(currentLocatioData.forecast.forecastday[0].day.maxtemp_c) + "° | Low " + Math.round(currentLocatioData.forecast.forecastday[0].day.mintemp_c) + "°";

   
}

document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestionsList');

    currentLocatioId = "id:"+2842265;
    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(currentLocatioId)}&days=3&aqi=no&alerts=yes`);
    currentLocatioData = await response.json();
    currentLocationName =currentLocatioData.location.name + ", " + currentLocatioData.location.country;
    searchInput.value = currentLocationName;
    updateDetails();
   
    function adjustSuggestionsListWidth() {
        const inputWidth = searchInput.getBoundingClientRect().width;
        suggestionsList.style.width = `${inputWidth - 10}px`;
    }

    adjustSuggestionsListWidth();
    window.addEventListener('resize', adjustSuggestionsListWidth);

    searchInput.addEventListener('click',  () => {
        searchInput.value = '';
    })

    searchInput.addEventListener('input', async () => {
        const query = searchInput.value;

        if (query.length == 0) {
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';
            return;
        }
        suggestionsList.style.display = 'block';
        try {
            const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(query)}`);
            const suggestions = await response.json();
            if (suggestions.length == 0) {
                suggestionsList.innerHTML = '';
                suggestionsList.style.display = 'none';
                return;
            }
            suggestionsList.innerHTML = suggestions.map(suggestion =>
                `<li id=${"id:" + suggestion.id}>${suggestion.name + ", " + suggestion.country}</li>`
            ).join('');


            suggestionsList.querySelectorAll('li').forEach(item => {
                item.addEventListener('click', async () => {
                    searchInput.value = item.textContent;
                    suggestionsList.innerHTML = '';
                    suggestionsList.style.display = 'none';
                    currentLocationName =item.textContent;
                    currentLocatioId = item.id;
                    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(currentLocatioId)}&days=3&aqi=no&alerts=yes`);
                    currentLocatioData = await response.json();
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
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';
        }
    });
});



