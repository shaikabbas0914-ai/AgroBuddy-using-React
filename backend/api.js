const express = require('express');
const { verifyToken } = require('./middleware');

const router = express.Router();

// Apply verifyToken middleware to protect these routes
router.use(verifyToken);

router.post('/crop-recommendation', (req, res) => {
  const { nitrogen, phosphorus, potassium, ph, temperature, humidity, rainfall } = req.body;
  
  // Basic mock logic based on inputs
  let crop = "Rice";
  let confidence = 92.5;

  if (ph > 7) crop = "Cotton";
  if (temperature < 20) crop = "Wheat";
  if (rainfall < 50) crop = "Millet";

  setTimeout(() => {
    res.json({
      crop,
      confidence,
      tips: [
        "Ensure proper drainage.",
        "Monitor for early signs of pests."
      ]
    });
  }, 1000); // Simulate network delay
});

router.post('/fertilizer-suggestion', (req, res) => {
  const { crop, soilType, nitrogen, phosphorus, potassium } = req.body;
  
  setTimeout(() => {
    res.json({
      nutrientStatus: "Low Nitrogen",
      suggestedFertilizer: "Urea",
      applicationRate: "50 kg/hectare"
    });
  }, 1000);
});

router.post('/disease-prediction', (req, res) => {
  // In a real app, you would handle file uploads here
  setTimeout(() => {
    res.json({
      disease: "Leaf Blight",
      confidence: 88.4,
      solution: "Apply Copper Fungicide and remove affected leaves."
    });
  }, 1500);
});

router.get('/weather', (req, res) => {
  // Mock weather data
  res.json({
    temperature: 28,
    condition: "Partly Cloudy",
    humidity: 65,
    forecast: "Light rain expected tomorrow."
  });
});

module.exports = router;
