import { useState } from 'react';
import axios from 'axios';
import { ThumbsUp, ThumbsDown, Shield, MapPin, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://crisis-misinformation-detector.onrender.com/api';

// Simple distance calculation using Haversine formula (avoids geolib dependency issues)
function calcDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const VerificationPanel = ({ report, user, userLocation, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const reportLat = report.location?.coordinates?.[1];
  const reportLng = report.location?.coordinates?.[0];

  const distance =
    userLocation && reportLat != null && reportLng != null
      ? calcDistanceMeters(userLocation.lat, userLocation.lng, reportLat, reportLng)
      : null;

  const distanceKm = distance != null ? (distance / 1000).toFixed(1) : '?';
  const canVerify = distance != null && distance <= 20000;

  const handleVerify = async (status) => {
    if (!userLocation || !user) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/verifications`, {
        userId: user._id,
        reportId: report._id,
        status,
        longitude: userLocation.lng,
        latitude: userLocation.lat,
      });
      setMessage(`Thanks! You earned points for this ${status === 'yes' ? 'confirmation' : 'rejection'}.`);
      onUpdate();
      setTimeout(onClose, 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-panel-wrapper">
      <div className="verify-panel">
        <div className="verify-info">
          <div className="verify-info-header">
            <div className="verify-info-title">
              <Shield size={20} color="#FF3B3B" />
              <span>Crisis Verification</span>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="verify-desc-box">
            <p className="verify-desc-label">Incident</p>
            <p className="verify-desc-text">{report.description}</p>
          </div>

          <div className="verify-meta">
            <span className="verify-distance">
              <MapPin size={14} />
              {distanceKm} km away
            </span>
            <span style={{ width: '1px', height: '16px', background: 'var(--border)' }}></span>
            <span
              className="verify-status"
              style={{ color: report.status === 'verified' ? 'var(--success)' : 'var(--primary)' }}
            >
              Status: {report.status}
            </span>
          </div>
        </div>

        <div className="verify-actions">
          {message ? (
            <div className="verify-message">{message}</div>
          ) : !canVerify ? (
            <div className="too-far-box">
              <p>TOO FAR TO VERIFY</p>
              <p>Move within 20km of the event</p>
            </div>
          ) : (
            <>
              <p className="verify-prompt">Is this happening?</p>
              <div className="verify-buttons">
                <button disabled={loading} onClick={() => handleVerify('yes')} className="btn btn-success">
                  <ThumbsUp size={16} />
                  Yes
                </button>
                <button disabled={loading} onClick={() => handleVerify('no')} className="btn btn-danger">
                  <ThumbsDown size={16} />
                  No
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationPanel;
