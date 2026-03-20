import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});
function Weather() {
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [aqi, setAqi] = useState(null);
  const [city, setCity] = useState("");
  const [coords, setCoords] = useState({ lat: 28.6139, lon: 77.209 }); // default Delhi
  const [background, setBackground] = useState(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);

  const WEATHER_KEY = "cebf9033a2d00516cef0dc784f4b04c6"; // OpenWeather API
  const UNSPLASH_KEY = "72D-NpzdWRCN1VHAyXV93Xn4NwnNk6ksTiw8wHa9u-o"; // Unsplash API
  // Helper: format city name

  const formatCity = (name) => {
    if (!name) return "Delhi";
    return name
      .split(" ")
      .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }; // Fetch weather + forecast + AQI + background

  const fetchWeather = (cityName) => {
    const formattedCity = formatCity(cityName);
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${formattedCity}&units=metric&appid=${WEATHER_KEY}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.cod !== 200) throw new Error(data.message);
        setCurrent(data);
        setCity(formattedCity);
        setCoords({ lat: data.coord.lat, lon: data.coord.lon }); // Forecast (5-day)

        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${formattedCity}&units=metric&appid=${WEATHER_KEY}`,
        )
          .then((res) => res.json())
          .then((fdata) => {
            if (fdata.cod !== "200") throw new Error(fdata.message);
            const daily = fdata.list.filter((_, idx) => idx % 8 === 0);
            setForecast(daily);
          }); // AQI

        fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${WEATHER_KEY}`,
        )
          .then((res) => res.json())
          .then((aqidata) => setAqi(aqidata.list[0]?.main || null)); // Unsplash background

        const query = data.weather[0]?.main || "weather";
        fetch(
          `https://api.unsplash.com/photos/random?query=${query}&client_id=${UNSPLASH_KEY}`,
        )
          .then((res) => res.json())
          .then((imgData) => setBackground(imgData.urls?.regular))
          .catch(() => setBackground(null));
      })
      .catch((err) => setError(err.message));
  }; // On load, detect user city via IP

  useEffect(() => {
    const fetchData = () => {
      fetch("https://ip-api.com/json/")
        .then((res) => res.json())
        .then((loc) => fetchWeather(loc.city || "Delhi"))
        .catch(() => fetchWeather("Delhi"));
    };
    fetchData();
    const interval = setInterval(fetchData, 60000); // auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim() !== "") {
      fetchWeather(input.trim());
      setInput("");
    }
  }; // Local time calculation

  const getLocalTime = (timezoneOffset) => {
    const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
    return new Date(utc + timezoneOffset * 1000).toLocaleTimeString();
  };

  if (error) return <h2>Error: {error}</h2>;
  if (!current) return <h2>Loading weather...</h2>;

  return (
    <div
      className="card"
      style={{
        background: background
          ? `url(${background}) center/cover no-repeat`
          : "#f2f2f2",
        color: background ? "white" : "black",
      }}
    >
            <h2>Weather Dashboard</h2> {/* Search */}     {" "}
      <form onSubmit={handleSearch}>
               {" "}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter city name"
        />
                <button type="submit">Search</button>     {" "}
      </form>
            <h3>{city}</h3>     {" "}
      <p>Local Time: {getLocalTime(current.timezone)}</p>     {" "}
      <p>
        Sunrise: {new Date(current.sys.sunrise * 1000).toLocaleTimeString()}
      </p>
           {" "}
      <p>Sunset: {new Date(current.sys.sunset * 1000).toLocaleTimeString()}</p> 
          {/* Current Weather */}     {" "}
      <div>
               {" "}
        <img
          src={`http://openweathermap.org/img/wn/${current.weather[0]?.icon}@2x.png`}
          alt={current.weather[0]?.description}
        />
                <p>Temperature: {current.main.temp} °C</p>       {" "}
        <p>Humidity: {current.main.humidity}%</p>       {" "}
        <p>Condition: {current.weather[0]?.main}</p>     {" "}
      </div>
            {/* AQI */}     {" "}
      {aqi && (
        <div>
                    <h4>Air Quality Index</h4>         {" "}
          <p>AQI Level: {aqi.aqi}</p>       {" "}
        </div>
      )}
            {/* 5-Day Forecast */}      <h4>5-Day Forecast</h4>     {" "}
      <div className="forecast">
               {" "}
        {forecast.map((day, idx) => {
          const date = new Date(day.dt * 1000);
          const weekday = date.toLocaleDateString(undefined, {
            weekday: "short",
          });
          return (
            <div className="day" key={idx}>
                            <p>{weekday}</p>
                           {" "}
              <img
                src={`http://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                alt={day.weather[0].description}
              />
                            <p>{Math.round(day.main.temp)}°C</p>           {" "}
            </div>
          );
        })}
             {" "}
      </div>
            {/* Leaflet Map */}      <h4>City Map</h4>     {" "}
      <MapContainer
        center={[coords.lat, coords.lon]}
        zoom={10}
        style={{ height: "200px", width: "100%" }}
      >
               {" "}
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /> 
             {" "}
        <Marker position={[coords.lat, coords.lon]}>
                    <Popup>{city}</Popup>       {" "}
        </Marker>
             {" "}
      </MapContainer>
         {" "}
    </div>
  );
}

export default Weather;
