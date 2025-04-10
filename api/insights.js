//Handles AI weather insights requests
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    try {
      // Handle preflight OPTIONS request
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      
      //POST request with weather data
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const weatherData = req.body;
      const API_KEY = process.env.GEMINI_ACCESS_KEY;
      
      // Check if we have the required API key
      if (!API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
      }
      
      //prompt for Gemini API
      const { name, main, weather, wind, sys } = weatherData;
      
      // Check if forecast data is available (if passed from frontend)
      let forecastInfo = '';
      if (weatherData.forecast && weatherData.forecast.list && weatherData.forecast.list.length > 0) {
        forecastInfo = '\n\nUpcoming 5-day forecast:';
        
        // Process forecast data to get one entry per day
        const dailyForecasts = [];
        const processedDates = new Set();
        
        weatherData.forecast.list.forEach(forecast => {
          const date = new Date(forecast.dt * 1000).toLocaleDateString();
          if (!processedDates.has(date)) {
            processedDates.add(date);
            dailyForecasts.push(forecast);
          }
        });
        
        // Add forecast data for the next 5 days
        dailyForecasts.slice(0, 5).forEach(forecast => {
          const date = new Date(forecast.dt * 1000);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
          forecastInfo += `\n- ${dayName}: ${forecast.weather[0].main} (${forecast.weather[0].description}), ${forecast.main.temp}°C, humidity ${forecast.main.humidity}%, wind ${forecast.wind.speed} km/h`;
        });
      }
      
      const prompt = `You are an AI weather assistant. First introduce yourself briefly (keep this introduction short and consistent), then provide 3-4 personalized insights and recommendations based on the following weather conditions in ${name}, ${sys.country} and provide just 2-3 suggestions and recommendations on the 5-day forecast at the end separately :
      - Temperature: ${main.temp}°C (feels like ${main.feels_like}°C)
      - Weather: ${weather[0].main} (${weather[0].description})
      - Humidity: ${main.humidity}%
      - Wind speed: ${wind.speed} km/h${forecastInfo}
      
      Format your response as a bulleted list with emoji icons. Include health tips, clothing recommendations, activity suggestions, safety precautions if any and any other useful relevant information . Keep each point concise and actionable.`;
      
     // Call the Gemini API
     const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
     const requestBody = {
       contents: [
         {
           parts: [
             {
               text: prompt
             }
           ]
         }
       ]
     };
     
     const geminiResponse = await fetch(`${endpoint}?key=${API_KEY}`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json"
       },
       body: JSON.stringify(requestBody)
     });
     
     if (!geminiResponse.ok) {
       const errorData = await geminiResponse.json();
       return res.status(geminiResponse.status).json(errorData);
     }
     
     const data = await geminiResponse.json();
     
     // Extract text from Gemini API response
     if (data.candidates && data.candidates[0] && data.candidates[0].content && 
         data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
       return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
     } else {
       return res.status(500).json({ error: 'Unexpected API response structure' });
     }
   } catch (error) {
     console.error('Gemini API error:', error);
     return res.status(500).json({
       error: 'Failed to generate insights',
       message: error.message
     });
   }
 }