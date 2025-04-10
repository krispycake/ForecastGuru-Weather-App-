//Handles weather forecast requests
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    try {
      const { query } = req;
      const city = query.city || 'Mumbai';
      const API_KEY = process.env.OPENWEATHER_API_KEY;
      
      // Check if we have the required API key
      if (!API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
      }
      
      // Make the request to OpenWeather Forecast API
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
      );
      
      
      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error('Forecast API error:', error);
      return res.status(500).json({
        error: 'Failed to fetch forecast data',
        message: error.message
      });
    }
  }