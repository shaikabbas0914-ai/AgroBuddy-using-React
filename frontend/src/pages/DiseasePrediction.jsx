import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { UploadCloud } from 'lucide-react';
import api from '../services/api';
import './Module.css';

const DiseasePrediction = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!image) return alert("Please select an image");
    
    setLoading(true);
    // In a real app, use FormData for file upload
    try {
      const response = await api.post('/api/disease-prediction', {});
      setResult(response.data);
    } catch (err) {
      console.error(err);
      alert("Error predicting disease");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-container">
      <h2>Disease Detection</h2>
      <p className="module-description">Upload a plant leaf image to identify diseases.</p>

      <div className="module-content">
        <Card className="form-card">
          <label className="upload-box" htmlFor="image-upload">
            <UploadCloud size={48} className="upload-icon" />
            <p><strong>Drag & Drop Image</strong></p>
            <p style={{ color: 'var(--color-dark-gray)', fontSize: '0.9rem', marginTop: '0.5rem' }}>or click to browse</p>
            <input 
              id="image-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleUpload} 
              style={{ display: 'none' }} 
            />
          </label>
          
          {preview && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img src={preview} alt="Preview" style={{ maxHeight: '200px', borderRadius: '8px' }} />
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <Button 
              text={loading ? 'Analyzing...' : 'Predict Disease'} 
              onClick={handleSubmit} 
              disabled={!image || loading} 
              className="w-full"
            />
          </div>
        </Card>

        {result && (
          <Card className="result-card">
            <h3>Disease Detected</h3>
            <div className="result-highlight" style={{ fontSize: '2rem', color: 'var(--color-error)' }}>{result.disease}</div>
            <p>Confidence: {result.confidence}%</p>
            
            <div className="result-tips" style={{ marginTop: '1.5rem' }}>
              <h4>Recommended Solution:</h4>
              <p>{result.solution}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DiseasePrediction;
