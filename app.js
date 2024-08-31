let currentLocatioData;
let currentLocationName;

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestionsList');

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
                    currentLocationName =item.textContent;
                    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=fd9923cd2bc740a5b2a13313242808&q=${encodeURIComponent(item.id)}&days=3&aqi=no&alerts=yes`);
                    currentLocatioData = await response.json();

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
