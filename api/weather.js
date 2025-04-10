//Handles current weather data requests with coordinates support
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    const { query } = req;
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    
    // Check if we have the required API key
    if (!API_KEY) {
      return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }
    
    let url;
    // Check if coordinates are provided
    if (query.lat && query.lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${query.lat}&lon=${query.lon}&units=metric&appid=${API_KEY}`;
    } else {
      // Fall back to city name
      const city = query.city || 'Mumbai';
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
    }
    
    // Make the request to OpenWeather API
    const response = await fetch(url);
    
    
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Weather API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch weather data',
      message: error.message
    });
  }
}