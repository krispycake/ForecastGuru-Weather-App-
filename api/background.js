//Handles background image requests
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    try {
      const { query } = req;
      const city = query.city || 'landscape';
      const API_KEY = process.env.UNSPLASH_ACCESS_KEY;
      
      // Check if we have the required API key
      if (!API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
      }
      
      // Make the request to Unsplash API
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=${city}&client_id=${API_KEY}`
      );
      
    
      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error('Unsplash API error:', error);
      return res.status(500).json({
        error: 'Failed to fetch background image',
        message: error.message
      });
    }
  }