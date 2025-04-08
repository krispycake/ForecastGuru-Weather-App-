let weather = {
  apiKey: process.env.OPENWEATHER_API_KEY,
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY,
  intervalId: null,
  currentTempCelsius: null, // Store current temperature in Celsius
  currentCity: null, // Store current city
  weatherData: null, // Store complete weather data
  forecastData: null, // Store forecast data

  fetchWeather: function (city) {
    this.currentCity = city;
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
      .then((data) => {
        this.weatherData = data;
        this.displayWeather(data);
        this.fetchForecast(city);
        this.generateWeatherInsights(data);
      });
  },

  displayWeather: function (data) {
    const { name } = data;
    const { icon, description } = data.weather[0];
    const { temp, humidity, feels_like, pressure } = data.main;
    const { speed } = data.wind;
    const { visibility } = data;
    const { sunrise, sunset } = data.sys;
    const timezoneOffset = data.timezone;
    
    this.currentTempCelsius = temp; 
    this.updateDateTime(timezoneOffset);
    
    document.querySelector(".city").innerText = "Weather in " + name;
    document.querySelector(".icon").src =
      "https://openweathermap.org/img/wn/" + icon + "@2x.png";
    document.querySelector(".description").innerText = description;
    document.querySelector(".temp").innerText = temp + "°C"; // Default to Celsius
    document.querySelector(".humidity").innerText =
      "Humidity: " + humidity + "%";
    document.querySelector(".wind").innerText =
      "Wind speed: " + speed + " km/h";
    
    //additional weather details
    document.querySelector(".feels-like").innerText = 
      "Feels like: " + feels_like.toFixed(1) + "°C";
    document.querySelector(".pressure").innerText = 
      "Pressure: " + pressure + " hPa";
    document.querySelector(".visibility").innerText = 
      "Visibility: " + (visibility / 1000).toFixed(1) + " km";
    
    // Convert sunrise and sunset to local time
    const sunriseDate = new Date((sunrise + timezoneOffset) * 1000);
    const sunsetDate = new Date((sunset + timezoneOffset) * 1000);
    const sunriseTime = sunriseDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const sunsetTime = sunsetDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    document.querySelector(".sunrise").innerText = "Sunrise: " + sunriseTime;
    document.querySelector(".sunset").innerText = "Sunset: " + sunsetTime;
    
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
    const feelsLikeElement = document.querySelector(".feels-like");
    const isCelsius = tempElement.innerText.includes("°C");
    
    if (isCelsius) {
      // Convert to Fahrenheit
      const tempFahrenheit = (this.currentTempCelsius * 9) / 5 + 32;
      tempElement.innerText = tempFahrenheit.toFixed(1) + "°F";
      
      // Convert feels like temperature
      if (this.weatherData && this.weatherData.main) {
        const feelsLikeFahrenheit = (this.weatherData.main.feels_like * 9) / 5 + 32;
        feelsLikeElement.innerText = "Feels like: " + feelsLikeFahrenheit.toFixed(1) + "°F";
      }
      
      // Convert forecast temperatures if available
      this.updateForecastTemperatures(false);
    } else {
      // Convert back to Celsius
      tempElement.innerText = this.currentTempCelsius.toFixed(1) + "°C";
      
      // Convert feels like temperature back to Celsius
      if (this.weatherData && this.weatherData.main) {
        feelsLikeElement.innerText = "Feels like: " + this.weatherData.main.feels_like.toFixed(1) + "°C";
      }
      
      // Convert forecast temperatures back to Celsius
      this.updateForecastTemperatures(true);
    }
  },
  
  updateForecastTemperatures: function(toCelsius) {
    const forecastItems = document.querySelectorAll('.forecast-item');
    
    if (!this.forecastData || forecastItems.length === 0) return;
    
    forecastItems.forEach((item, index) => {
      if (index < this.forecastData.list.length) {
        const tempElement = item.querySelector('.forecast-temp');
        const tempCelsius = this.forecastData.list[index].main.temp;
        
        if (toCelsius) {
          tempElement.innerText = tempCelsius.toFixed(1) + "°C";
        } else {
          const tempFahrenheit = (tempCelsius * 9) / 5 + 32;
          tempElement.innerText = tempFahrenheit.toFixed(1) + "°F";
        }
      }
    });
  },

  // Fetch forecast data for a city
  fetchForecast: function(city) {
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${this.apiKey}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("No forecast found.");
        }
        return response.json();
      })
      .then((data) => {
        this.forecastData = data;
        this.displayForecast(data);
      })
      .catch(error => console.error("Forecast Error:", error));
  },

  // Display forecast data
  displayForecast: function(data) {
    const forecastContainer = document.querySelector(".forecast-container");
    forecastContainer.innerHTML = "";
    
    // Get one forecast per day (every 8th item is a new day, as data is in 3-hour intervals)
    const dailyForecasts = [];
    const processedDates = new Set();
    
    // Process the forecast list to get one entry per day
    data.list.forEach(forecast => {
      const date = new Date(forecast.dt * 1000).toLocaleDateString();
      if (!processedDates.has(date)) {
        processedDates.add(date);
        dailyForecasts.push(forecast);
      }
    });
    
    // Display only the next 5 days
    dailyForecasts.slice(0, 5).forEach(forecast => {
      const date = new Date(forecast.dt * 1000);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const temp = forecast.main.temp;
      const icon = forecast.weather[0].icon;
      const description = forecast.weather[0].description;
      
      const forecastItem = document.createElement("div");
      forecastItem.classList.add("forecast-item");
      forecastItem.innerHTML = `
        <div class="forecast-day">${dayName}</div>
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}" class="forecast-icon">
        <div class="forecast-temp">${temp.toFixed(1)}°C</div>
        <div class="forecast-desc">${description}</div>
      `;
      
      forecastContainer.appendChild(forecastItem);
    });
  },

  // Generate AI-powered weather insights using Gemini API
  generateWeatherInsights: async function(data) {
    const insightsContainer = document.querySelector(".ai-insights");
    insightsContainer.innerHTML = `
      <div class="insights-header">
        <h3><i class="fas fa-robot"></i> AI Weather Insights</h3>
        <div class="loading-spinner" id="insights-loader">
          <div class="spinner"></div>
        </div>
      </div>
      <p>Generating personalized insights with Gemini AI...</p>
    `;
    
    // Extract relevant weather data
    const { name } = data;
    const { temp, humidity, feels_like } = data.main;
    const { description, main } = data.weather[0];
    const { speed } = data.wind;
    const { country } = data.sys;
    
    // Format the prompt for Gemini API
    const prompt = `You are an AI weather assistant. Provide 3-4 personalized insights and recommendations based on the following weather conditions in ${name}, ${country}:
    - Temperature: ${temp}°C (feels like ${feels_like}°C)
    - Weather: ${main} (${description})
    - Humidity: ${humidity}%
    - Wind speed: ${speed} km/h
    
    Format your response as a bulleted list with emoji icons. Include health tips, clothing recommendations, activity suggestions, and any relevant safety precautions. Keep each point concise and actionable.`;
    
    try {
      // Call the Gemini API
      const insights = await this.callGeminiAPI(prompt);
      document.getElementById('insights-loader').style.display = 'none';
      
      if (insights && insights.trim()) {
        // Format the insights
        const formattedInsights = insights
          .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points
          .split('\n')
          .filter(line => line.trim() !== '');
        
        const insightsList = document.createElement("ul");
        formattedInsights.forEach(insight => {
          const insightItem = document.createElement("li");
          insightItem.innerHTML = insight;
          insightsList.appendChild(insightItem);
        });
        
        // Clear loading message and append insights
        insightsContainer.innerHTML = `
          <div class="insights-header">
            <h3><i class="fas fa-robot"></i> AI Weather Insights</h3>
          </div>
        `;
        insightsContainer.appendChild(insightsList);
      } else {
        // Fallback if API returns empty response
        this.generateFallbackInsights(data);
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      // Use fallback insights if API fails
      document.getElementById('insights-loader').style.display = 'none';
      this.generateFallbackInsights(data);
    }
  },

  // Call Gemini API using fetch
  callGeminiAPI: async function(prompt) {
    try {
      const apiKey = process.env.GEMINI_ACCESS_KEY;
      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      
      // Here prompt is the variable containing our constructed prompt string
      // and we're assigning it to the text property in the request body
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt  // Correctly assigning the prompt variable to the text property
              }
            ]
          }
        ]
      };
      
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API response error:', errorData);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if the response has the expected structure
      if (data.candidates && data.candidates[0] && data.candidates[0].content && 
          data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.error('Unexpected API response structure:', data);
        throw new Error('Unexpected API response structure');
      }
    } catch (error) {
      console.error('Error with Gemini API:', error);
      throw error;
    }
  },

  // Fallback insights generator if API fails
  generateFallbackInsights: function(data) {
    const { temp } = data.main;
    const { description } = data.weather[0];
    const { speed } = data.wind;
    
    let insights = [];
    
    // Temperature-based insights
    if (temp > 30) {
      insights.push("🔥 It's very hot today. Stay hydrated and avoid prolonged sun exposure.");
    } else if (temp > 25) {
      insights.push("☀️ It's warm today. Light clothing recommended.");
    } else if (temp < 10) {
      insights.push("❄️ It's cold today. Bundle up with warm layers.");
    } else if (temp < 0) {
      insights.push("🥶 Freezing temperatures! Wear winter clothing and be cautious of ice.");
    }
    
    // Weather condition insights
    if (description.includes("rain")) {
      insights.push("🌧️ Rainy conditions expected. Bring an umbrella and waterproof footwear.");
    } else if (description.includes("snow")) {
      insights.push("❄️ Snowy conditions expected. Drive carefully and wear appropriate footwear.");
    } else if (description.includes("cloud")) {
      insights.push("☁️ Cloudy skies today. Good for outdoor activities without direct sunlight.");
    } else if (description.includes("clear")) {
      insights.push("☀️ Clear skies today. Great for outdoor activities, but don't forget sunscreen!");
    } else if (description.includes("fog") || description.includes("mist")) {
      insights.push("🌫️ Reduced visibility due to fog/mist. Drive carefully if you're on the road.");
    }
    
    // Wind-based insights
    if (speed > 20) {
      insights.push("💨 Strong winds today. Secure loose objects outdoors and be cautious.");
    } else if (speed > 10) {
      insights.push("🍃 Moderate winds expected. Light objects may be affected outdoors.");
    }
    
    const insightsContainer = document.querySelector(".ai-insights");
    insightsContainer.innerHTML = `
      <div class="insights-header">
        <h3><i class="fas fa-robot"></i> AI Weather Insights</h3>
      </div>
    `;
    
    if (insights.length > 0) {
      const insightsList = document.createElement("ul");
      insights.forEach(insight => {
        const insightItem = document.createElement("li");
        insightItem.innerHTML = insight;
        insightsList.appendChild(insightItem);
      });
      insightsContainer.appendChild(insightsList);
    } else {
      insightsContainer.innerHTML += "<p>No specific insights available for current conditions.</p>";
    }
  },

  // Get user's current location
  getLocation: function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this.fetchWeatherByCoords(lat, lon);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Unable to retrieve your location. Using default city.");
          this.fetchWeather("Mumbai");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser. Using default city.");
      this.fetchWeather("Mumbai");
    }
  },

  // Fetch weather by coordinates
  fetchWeatherByCoords: function(lat, lon) {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("No weather found.");
        }
        return response.json();
      })
      .then((data) => {
        this.weatherData = data;
        this.currentCity = data.name;
        this.displayWeather(data);
        this.fetchForecast(data.name);
        this.generateWeatherInsights(data);
      })
      .catch(error => console.error("Weather Error:", error));
  },

  // Show AI insights modal
  showAIInsightsModal: async function() {
    const modal = document.getElementById('aiInsightsModal');
    modal.style.display = 'block';
    
    // Generate insights for the modal if we have weather data
    if (this.weatherData) {
      await this.generateWeatherInsights(this.weatherData);
    }
  },

  // Close AI insights modal
  closeAIInsightsModal: function() {
    const modal = document.getElementById('aiInsightsModal');
    modal.style.display = 'none';
  },

  // Get weather history for the current location
  getWeatherHistory: function() {
    if (!this.currentCity) return;
    
    const historyContainer = document.querySelector(".weather-history");
    historyContainer.innerHTML = "<h3>Weather Statistics</h3><p>Loading historical data...</p>";
    
    // In a real app, you would fetch historical data from a weather API
    // For this demo, we'll simulate with some static data
    setTimeout(() => {
      const historicalData = {
        "averageTemp": (this.currentTempCelsius - 2 + Math.random() * 4).toFixed(1),
        "maxTemp": (this.currentTempCelsius + 2 + Math.random() * 3).toFixed(1),
        "minTemp": (this.currentTempCelsius - 4 - Math.random() * 2).toFixed(1),
        "rainDays": Math.floor(Math.random() * 10),
      };
      
      historyContainer.innerHTML = `
        <h3>Weather Statistics for ${this.currentCity}</h3>
        <p>Monthly Average Temperature: ${historicalData.averageTemp}°C</p>
        <p>Monthly Maximum Temperature: ${historicalData.maxTemp}°C</p>
        <p>Monthly Minimum Temperature: ${historicalData.minTemp}°C</p>
        <p>Average Rain Days per Month: ${historicalData.rainDays}</p>
      `;
    }, 1000);
  },

  // Initialize the app
  init: function() {
    // Set up event listeners
    document.querySelector(".search button").addEventListener("click", () => {
      this.search();
    });
    
    document.querySelector(".search-bar").addEventListener("keyup", (event) => {
      if (event.key == "Enter") {
        this.search();
      }
    });
    
    document.querySelector(".toggle-unit").addEventListener("change", () => {
      this.convertTemp();
    });
    
    document.querySelector(".location-btn").addEventListener("click", () => {
      this.getLocation();
    });
    
    document.querySelector(".history-btn").addEventListener("click", () => {
      this.getWeatherHistory();
    });
    
    // AI insights button
    document.querySelector(".ai-insights-btn").addEventListener("click", () => {
      this.showAIInsightsModal();
    });
    
    // Close modal button
    document.querySelector(".close-modal").addEventListener("click", () => {
      this.closeAIInsightsModal();
    });
    
    // Close modal when clicking outside
    window.addEventListener("click", (event) => {
      const modal = document.getElementById('aiInsightsModal');
      if (event.target === modal) {
        this.closeAIInsightsModal();
      }
    });
    
    // Get user's location on page load
    this.getLocation();
  }
};

// Initialize the app
weather.init();