const express = require('express');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get current weather
router.get('/current', verifyToken, async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'City parameter required' });
    }

    if (!process.env.WEATHER_API_KEY) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );

    if (!weatherResponse.ok) {
      return res.status(weatherResponse.status).json({ 
        error: 'Failed to fetch weather data' 
      });
    }

    const weatherData = await weatherResponse.json();

    res.json({
      city: weatherData.name,
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

// Get weather by coordinates
router.get('/coordinates', verifyToken, async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    if (!process.env.WEATHER_API_KEY) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );

    if (!weatherResponse.ok) {
      return res.status(weatherResponse.status).json({ 
        error: 'Failed to fetch weather data' 
      });
    }

    const weatherData = await weatherResponse.json();

    res.json({
      city: weatherData.name,
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

module.exports = router;
