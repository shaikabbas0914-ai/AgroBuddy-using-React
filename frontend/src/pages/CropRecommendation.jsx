import React, { useState } from 'react';
import Card from '../components/Card';
import InputField from '../components/InputField';
import Button from '../components/Button';
import api from '../services/api';
import './Module.css';

const CropRecommendation = () => {
  const [formData, setFormData] = useState({
    nitrogen: '', phosphorus: '', potassium: '', 
    ph: '', temperature: '', humidity: '', rainfall: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/api/crop-recommendation', formData);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      alert("Error fetching recommendation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-container">
      <h2>Crop Recommendation</h2>
      <p className="module-description">Enter soil details to get the best crop suggestion.</p>

      <div className="module-content">
        <Card className="form-card">
          <form onSubmit={handleSubmit} className="input-grid">
            <InputField label="Nitrogen (N)" name="nitrogen" type="number" value={formData.nitrogen} onChange={handleChange} required />
            <InputField label="Phosphorus (P)" name="phosphorus" type="number" value={formData.phosphorus} onChange={handleChange} required />
            <InputField label="Potassium (K)" name="potassium" type="number" value={formData.potassium} onChange={handleChange} required />
            <InputField label="pH Level" name="ph" type="number" value={formData.ph} onChange={handleChange} required />
            <InputField label="Temperature (°C)" name="temperature" type="number" value={formData.temperature} onChange={handleChange} required />
            <InputField label="Humidity (%)" name="humidity" type="number" value={formData.humidity} onChange={handleChange} required />
            <InputField label="Rainfall (mm)" name="rainfall" type="number" value={formData.rainfall} onChange={handleChange} required />
            
            <div className="form-actions">
              <Button text={loading ? 'Analyzing...' : 'Get Recommendation'} type="submit" disabled={loading} />
            </div>
          </form>
        </Card>

        {result && (
          <Card className="result-card">
            <h3>Recommended Crop</h3>
            <div className="result-highlight">{result.crop}</div>
            <p>Confidence: {result.confidence}%</p>
            
            <div className="result-tips">
              <h4>Tips for {result.crop}:</h4>
              <ul>
                {result.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CropRecommendation;
