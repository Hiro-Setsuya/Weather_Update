const weatherForm = document.querySelector("#weatherForm");
const cityInput = document.querySelector("#cityInput");
const card = document.querySelector("#card");
const suggestionsContainer = document.querySelector("#suggestions");
const apiKey = "5f50747c10b447fa59d7129c2c44fe75";
const existingElements = {
  cityName: document.querySelector(".cityName"),
  temperature: document.querySelector(".temperature"),
  description: document.querySelector(".description"),
  weatherEmoji: document.querySelector(".weatherEmoji"),
  feelsLike: document.querySelector(".feels-like"),
  humidity: document.querySelector(".humidity"),
  wind: document.querySelector(".wind"),
  country: document.querySelector(".country"),
  error: document.querySelector(".error"),
};

// Debounce function to limit API calls
function debounce(func, delay) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, arguments), delay);
  };
}

// Show city suggestions
cityInput.addEventListener(
  "input",
  debounce(async function (e) {
    const query = e.target.value.trim();
    if (query.length < 2) {
      suggestionsContainer.style.display = "none";
      return;
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`
      );
      const data = await response.json();

      suggestionsContainer.innerHTML = "";
      if (data.length > 0) {
        data.forEach((city) => {
          const suggestion = document.createElement("div");
          suggestion.className = "suggestion-item";
          suggestion.innerHTML = `
          ${city.name}, ${city.state || ""} 
          <span>
            ${city.country}
            <span class="country-flag">${getCountryFlag(city.country)}</span>
          </span>
        `;
          suggestion.addEventListener("click", () => {
            cityInput.value = `${city.name}, ${city.country}`;
            suggestionsContainer.style.display = "none";
          });
          suggestionsContainer.appendChild(suggestion);
        });
        suggestionsContainer.style.display = "block";
      } else {
        suggestionsContainer.style.display = "none";
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      suggestionsContainer.style.display = "none";
    }
  }, 300)
);

// Hide suggestions when clicking elsewhere
document.addEventListener("click", (e) => {
  if (!cityInput.contains(e.target)) {
    suggestionsContainer.style.display = "none";
  }
});

weatherForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  try {
    showLoading();
    const weatherData = await getWeatherData(city);
    displayWeatherInfo(weatherData);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    showError(
      error.message || "Failed to fetch weather data. Please try again."
    );
  }
});

async function getWeatherData(city) {
  // First get coordinates for more accurate results
  const geoResponse = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`
  );
  const geoData = await geoResponse.json();

  if (!geoData || geoData.length === 0) {
    throw new Error("City not found. Please try another location.");
  }

  const { lat, lon } = geoData[0];
  const weatherResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
  );

  if (!weatherResponse.ok) {
    throw new Error("Failed to fetch weather data");
  }

  return await weatherResponse.json();
}

function displayWeatherInfo(data) {
  existingElements.error.style.display = "none";

  existingElements.cityName.textContent = `${data.name}, ${data.sys.country}`;
  existingElements.temperature.textContent = `${data.main.temp.toFixed(1)}°C`;
  existingElements.description.textContent = data.weather[0].description;
  existingElements.weatherEmoji.textContent = getWeatherEmoji(
    data.weather[0].id
  );
  existingElements.feelsLike.textContent = `Feels like: ${data.main.feels_like.toFixed(
    1
  )}°C`;
  existingElements.humidity.textContent = `Humidity: ${data.main.humidity}%`;
  existingElements.wind.textContent = `Wind: ${data.wind.speed} m/s`;
  existingElements.country.textContent = `Country: ${
    data.sys.country
  } ${getCountryFlag(data.sys.country)}`;

  card.style.display = "block";
}

function getCountryFlag(countryCode) {
  // Convert country code to regional indicator symbols
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()));
}

function getWeatherEmoji(weatherId) {
  if (weatherId >= 200 && weatherId < 300) return "⛈️";
  if (weatherId >= 300 && weatherId < 400) return "🌦️";
  if (weatherId >= 500 && weatherId < 600) return "🌧️";
  if (weatherId >= 600 && weatherId < 700) return "❄️";
  if (weatherId >= 700 && weatherId < 800) return "🌫️";
  if (weatherId === 800) return "☀️";
  if (weatherId > 800 && weatherId < 900) return "☁️";
  return "🌈";
}

function showError(message) {
  existingElements.error.textContent = message;
  existingElements.error.style.display = "block";
  card.style.display = "block";

  // Hide other elements
  existingElements.cityName.textContent = "";
  existingElements.temperature.textContent = "";
  existingElements.description.textContent = "";
  existingElements.weatherEmoji.textContent = "";

  if (existingElements.feelsLike) existingElements.feelsLike.textContent = "";
  if (existingElements.humidity) existingElements.humidity.textContent = "";
  if (existingElements.wind) existingElements.wind.textContent = "";
}

function showLoading() {
  card.style.display = "block";
  existingElements.cityName.textContent = "Loading...";
  existingElements.temperature.textContent = "";
  existingElements.description.textContent = "";
  existingElements.weatherEmoji.textContent = "⏳";
  existingElements.error.style.display = "none";

  if (existingElements.feelsLike) existingElements.feelsLike.textContent = "";
  if (existingElements.humidity) existingElements.humidity.textContent = "";
  if (existingElements.wind) existingElements.wind.textContent = "";
}
