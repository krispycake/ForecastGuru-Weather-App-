let weather = {
  apiKey: "67b92f0af5416edbfe58458f502b0a31",
  unsplashAccessKey: "unsplash-api-key",
  intervalId: null,
  currentTempCelsius: null, // Store current temperature in Celsius

  fetchWeather: function (city) {
    fetch(
      "https://api.openweathermap.org/data/2.5/weather?q=" +
        city +
        "&units=metric&appid=" +
        this.apiKey
    )
      .then((response) => {
        if (!response.ok) {
          alert("No weather found.");
          throw new Error("No weather found.");
        }
        return response.json();
      })
      .then((data) => this.displayWeather(data));
  },

  displayWeather: function (data) {
    const { name } = data;
    const { icon, description } = data.weather[0];
    const { temp, humidity } = data.main;
    const { speed } = data.wind;
    const timezoneOffset = data.timezone;
    
    this.currentTempCelsius = temp; // Save the current temperature in Celsius
    this.updateDateTime(timezoneOffset);
    
    document.querySelector(".city").innerText = "Weather in " + name;
    document.querySelector(".icon").src =
      "https://openweathermap.org/img/wn/" + icon + ".png";
    document.querySelector(".description").innerText = description;
    document.querySelector(".temp").innerText = temp + "°C"; // Default to Celsius
    document.querySelector(".humidity").innerText =
      "Humidity: " + humidity + "%";
    document.querySelector(".wind").innerText =
      "Wind speed: " + speed + " km/h";
    document.querySelector(".weather").classList.remove("loading");

    this.fetchBackgroundImage(name);

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(() => this.updateDateTime(timezoneOffset), 1000);
  },

  fetchBackgroundImage: function (city) {
    fetch(
      `https://api.unsplash.com/photos/random?query=${city}&client_id=${this.unsplashAccessKey}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error fetching background image from Unsplash.");
        }
        return response.json();
      })
      .then((data) => {
        const imageUrl = data.urls.regular;
        document.body.style.backgroundImage = `url('${imageUrl}')`;
      })
      .catch((error) => {
        console.error("Unsplash Error:", error);
        document.body.style.backgroundImage =
          "url('https://source.unsplash.com/1920x1080/?" + city + "')"; // Fallback to static Unsplash query
      });
  },

  search: function () {
    this.fetchWeather(document.querySelector(".search-bar").value);
  },

  updateDateTime: function (timezoneOffset) {
    const localDate = new Date();
    const utc = localDate.getTime() + localDate.getTimezoneOffset() * 60000;
    const locationTime = new Date(utc + 1000 * timezoneOffset);
    const date = locationTime.toLocaleDateString();
    const time = locationTime.toLocaleTimeString();
    document.querySelector(".date").innerText = "Date: " + date;
    document.querySelector(".time").innerText = "Time: " + time;
  },

  convertTemp: function () {
    const tempElement = document.querySelector(".temp");
    const isCelsius = tempElement.innerText.includes("°C");
    if (isCelsius) {
      const tempFahrenheit = (this.currentTempCelsius * 9) / 5 + 32;
      tempElement.innerText = tempFahrenheit.toFixed(2) + "°F";
    } else {
      tempElement.innerText = this.currentTempCelsius.toFixed(2) + "°C";
    }
  }
};

document.querySelector(".search button").addEventListener("click", function () {
  weather.search();
});

document.querySelector(".search-bar").addEventListener("keyup", function (event) {
  if (event.key == "Enter") {
    weather.search();
  }
});

// Listen to the toggle switch for changing temperature units
document.querySelector(".toggle-unit").addEventListener("change", function () {
  weather.convertTemp();
});

// Default city weather on page load
weather.fetchWeather("Mumbai");
