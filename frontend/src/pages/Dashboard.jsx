import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { Sprout, FlaskConical, Bug, CloudSun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await api.get('/api/weather');
        setWeather(response.data);
      } catch (err) {
        console.error("Failed to fetch weather", err);
      }
    };
    fetchWeather();
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Welcome to AgroBuddy</h1>
      <p className="dashboard-subtitle">Your smart farming assistant. What would you like to do today?</p>

      {weather && (
        <Card className="weather-widget">
          <div className="weather-header">
            <CloudSun size={32} color="var(--color-green)" />
            <h3>Current Weather</h3>
          </div>
          <div className="weather-body">
            <p><strong>{weather.temperature}°C</strong> | {weather.condition}</p>
            <p>Humidity: {weather.humidity}%</p>
            <p className="weather-forecast">Forecast: {weather.forecast}</p>
          </div>
        </Card>
      )}

      <div className="module-grid">
        <Card hoverable className="module-card" onClick={() => navigate('/crop')}>
          <div className="module-icon bg-light-green">
            <Sprout size={32} color="var(--color-green)" />
          </div>
          <h3>Crop Recommendation</h3>
          <p>Get AI-powered suggestions for the best crop based on your soil.</p>
        </Card>

        <Card hoverable className="module-card" onClick={() => navigate('/fertilizer')}>
          <div className="module-icon bg-light-blue">
            <FlaskConical size={32} color="#0288D1" />
          </div>
          <h3>Fertilizer Suggestion</h3>
          <p>Find out which fertilizer your soil needs to maximize yield.</p>
        </Card>

        <Card hoverable className="module-card" onClick={() => navigate('/disease')}>
          <div className="module-icon bg-light-red">
            <Bug size={32} color="var(--color-error)" />
          </div>
          <h3>Disease Detection</h3>
          <p>Upload a photo of your plant to instantly identify diseases.</p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
