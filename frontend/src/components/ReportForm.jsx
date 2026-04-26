import { useState } from 'react';
import axios from 'axios';
import { X, Send, AlertCircle } from 'lucide-react';

const rawApiUrl = import.meta.env.VITE_API_URL || 'https://crisis-misinformation-detector.onrender.com/api';
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

const ReportForm = ({ onClose, user, location, onDetectLocation, onSuccess }) => {
  const [type, setType] = useState('accident');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError('Location access required to submit a report');
      return;
    }
    if (!user) {
      setError('User session not initialized yet');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/reports`, {
        userId: user._id,
        type,
        description,
        longitude: location.lng,
        latitude: location.lat,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const crisisTypes = ['flood', 'fire', 'accident', 'earthquake', 'storm', 'medical'];

  return (
    <div className="slide-panel">
      <div className="slide-panel-header">
        <div>
          <h2>Report Emergency</h2>
          <p>Provide accurate details for verification</p>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="slide-panel-body">
        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="form-label">Crisis Type</label>
          <div className="type-grid">
            {crisisTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`type-option ${type === t ? 'selected' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what is happening..."
            className="form-textarea"
          />
        </div>

        <div className="geo-tag-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            <div className="geo-tag-icon">
              <Send size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="geo-tag-label">Crisis Location</p>
              <p className="geo-tag-value">
                {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Click on the map to set location'}
              </p>
            </div>
            <button 
              type="button" 
              onClick={onDetectLocation}
              className="btn btn-ghost" 
              style={{ padding: '8px', fontSize: '11px', height: 'auto' }}
              title="Use my current location"
            >
              Detect Location
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic', margin: 0 }}>
            * Tip: You can click anywhere on the map to drop a pin for the exact crisis location.
          </p>
        </div>

        <button disabled={loading} type="submit" className="btn btn-primary" style={{ width: '100%', height: '52px', justifyContent: 'center', fontSize: '16px', marginTop: 'auto' }}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

export default ReportForm;
