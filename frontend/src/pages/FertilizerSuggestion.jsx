import React, { useState } from 'react';
import Card from '../components/Card';
import InputField from '../components/InputField';
import Button from '../components/Button';
import api from '../services/api';
import './Module.css';

const FertilizerSuggestion = () => {
  const [formData, setFormData] = useState({
    crop: '', soilType: '', nitrogen: '', phosphorus: '', potassium: ''
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
      const response = await api.post('/api/fertilizer-suggestion', formData);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      alert("Error fetching suggestion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-container">
      <h2>Fertilizer Suggestion</h2>
      <p className="module-description">Enter soil and crop details to get fertilizer recommendations.</p>

      <div className="module-content">
        <Card className="form-card">
          <form onSubmit={handleSubmit} className="input-grid">
            <InputField label="Crop you want to grow" name="crop" value={formData.crop} onChange={handleChange} required />
            <InputField label="Soil Type" name="soilType" value={formData.soilType} onChange={handleChange} required />
            <InputField label="Nitrogen (N)" name="nitrogen" type="number" value={formData.nitrogen} onChange={handleChange} required />
            <InputField label="Phosphorus (P)" name="phosphorus" type="number" value={formData.phosphorus} onChange={handleChange} required />
            <InputField label="Potassium (K)" name="potassium" type="number" value={formData.potassium} onChange={handleChange} required />
            
            <div className="form-actions">
              <Button text={loading ? 'Analyzing...' : 'Get Suggestion'} type="submit" disabled={loading} />
            </div>
          </form>
        </Card>

        {result && (
          <Card className="result-card">
            <h3>Suggested Fertilizer</h3>
            <div className="result-highlight" style={{ fontSize: '2rem' }}>{result.suggestedFertilizer}</div>
            <p><strong>Status:</strong> {result.nutrientStatus}</p>
            <p><strong>Rate:</strong> {result.applicationRate}</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FertilizerSuggestion;
