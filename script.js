const cityInput = document.getElementById("city-input");
const searchForm = document.getElementById("search-form");
const cityNameEl = document.getElementById("city-name");
const temperatureEl = document.getElementById("temperature");
const conditionEl = document.getElementById("condition");
const dateTimeEl = document.getElementById("date-time");
const feelsLikeEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const precipitationEl = document.getElementById("precipitation");
const weatherIconEl = document.getElementById("weather-icon");
const hourlyForecastEl = document.getElementById("hourly-forecast");
const dailyForecastEl = document.getElementById("daily-forecast");

const defaultCity = "London";

function getWeatherCodeLabel(code) {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Heavy rain showers",
    82: "Violent rain showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm"
  };

  return map[code] || "Weather";
}

function getWeatherIcon(code) {
  const icons = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    53: "🌦️",
    55: "🌧️",
    56: "🌧️",
    57: "🌧️",
    61: "🌦️",
    63: "🌧️",
    65: "🌧️",
    66: "🌧️",
    67: "🌧️",
    71: "🌨️",
    73: "❄️",
    75: "❄️",
    77: "❄️",
    80: "🌦️",
    81: "🌧️",
    82: "⛈️",
    85: "🌨️",
    86: "🌨️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️"
  };

  return icons[code] || "🌤️";
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatDay(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short"
  }).format(date);
}

async function searchCity(city) {
  const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

  const response = await fetch(geocodeUrl);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found.");
  }

  const result = data.results[0];
  return {
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country
  };
}

async function fetchWeather(latitude, longitude) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;

  const response = await fetch(weatherUrl);
  return response.json();
}

function renderCurrentWeather(data, cityName) {
  const current = data.current;
  const condition = getWeatherCodeLabel(current.weather_code);
  const icon = getWeatherIcon(current.weather_code);

  cityNameEl.textContent = `${cityName}`;
  temperatureEl.textContent = `${Math.round(current.temperature_2m)}°C`;
  conditionEl.textContent = condition;
  dateTimeEl.textContent = formatDateTime(new Date().toISOString());
  feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidityEl.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  windEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  precipitationEl.textContent = `${current.precipitation || 0} mm`;
  weatherIconEl.textContent = icon;
}

function renderHourlyWeather(hourly) {
  const items = [];
  const nowHour = new Date().getHours();

  for (let i = 0; i < 8; i++) {
    const temperature = Math.round(hourly.temperature_2m[i]);
    const code = hourly.weather_code[i];
    const icon = getWeatherIcon(code);

    items.push(`
      <div class="forecast-item">
        <div class="time">${i === 0 ? "Now" : `+${i}h`}</div>
        <div class="icon">${icon}</div>
        <strong>${temperature}°C</strong>
      </div>
    `);
  }

  hourlyForecastEl.innerHTML = items.join("");
}

function renderDailyWeather(daily) {
  const rows = daily.time.map((date, index) => {
    const max = Math.round(daily.temperature_2m_max[index]);
    const min = Math.round(daily.temperature_2m_min[index]);
    const code = daily.weather_code[index];
    const icon = getWeatherIcon(code);

    return `
      <div class="daily-row">
        <div class="date">${index === 0 ? "Today" : formatDay(date)}</div>
        <div class="day-icon">${icon}</div>
        <div class="temps">${max}° / ${min}°</div>
        <div>${getWeatherCodeLabel(code)}</div>
      </div>
    `;
  });

  dailyForecastEl.innerHTML = rows.join("");
}

async function updateWeather(city) {
  try {
    const location = await searchCity(city);
    const data = await fetchWeather(location.latitude, location.longitude);

    renderCurrentWeather(data, `${location.name}, ${location.country}`);
    renderHourlyWeather(data.hourly);
    renderDailyWeather(data.daily);
  } catch (error) {
    alert(error.message || "Unable to load weather data.");
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  await updateWeather(city);
});

updateWeather(defaultCity);
