import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MapPin, AlertTriangle, ShieldCheck, Trophy, Bell, LogOut } from 'lucide-react';
import MapComponent from './components/Map';
import ReportList from './components/ReportList';
import ReportForm from './components/ReportForm';
import Leaderboard from './components/Leaderboard';
import VerificationPanel from './components/VerificationPanel';
import Login from './pages/Login';
import Signup from './pages/Signup';
import api from './services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://crisis-misinformation-detector.onrender.com/api';
const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://crisis-misinformation-detector.onrender.com');

function App() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [crisisLocation, setCrisisLocation] = useState(null);

  // Initialize User
  useEffect(() => {
    const initUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Auth check failed", err);
          localStorage.removeItem('token');
        }
      }
    };
    initUser();
  }, []);

  // Track Location
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          if (user) {
            socket.emit('join_location', { lat: pos.coords.latitude, lng: pos.coords.longitude, userId: user._id });
          }
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [user]);

  // Fetch Reports
  const fetchReports = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/reports`);
      setReports(res.data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchReports();
  }, [fetchReports]);

  // Socket Listeners
  useEffect(() => {
    socket.on('new_report', (report) => {
      setReports((prev) => [report, ...prev]);
      setNotifications((prev) => [{ id: Date.now(), message: `New ${report.type} report nearby!` }, ...prev]);
      // Auto-clear after 5s
      setTimeout(() => {
        setNotifications((prev) => prev.slice(0, -1));
      }, 5000);
    });

    socket.on('status_change', ({ reportId, status }) => {
      setReports((prev) => prev.map((r) => (r._id === reportId ? { ...r, status } : r)));
    });

    socket.on('verification_update', ({ reportId, status, legitimacyScore }) => {
      setReports((prev) => prev.map((r) => (r._id === reportId ? { ...r, status, legitimacyScore } : r)));
    });

    return () => {
      socket.off('new_report');
      socket.off('status_change');
      socket.off('verification_update');
    };
  }, []);

  const handleReportClick = (report) => {
    setSelectedReport(report);
    setShowReportForm(false);
  };

  const trustDisplay = user ? `${(user.trustScore * 100).toFixed(0)}%` : '—';

  if (!user) {
    return isLoginView ? (
      <Login onLogin={setUser} onSwitchToSignup={() => setIsLoginView(false)} />
    ) : (
      <Signup onLogin={setUser} onSwitchToLogin={() => setIsLoginView(true)} />
    );
  }

  return (
    <div className="app-layout">
      {/* Alert Banner */}
      <div className="alert-banner">
        <AlertTriangle size={14} />
        <span>ACTIVE EMERGENCY GROUND TRUTH SYSTEM — LIVE VALIDATION ONLY</span>
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="brand-text">
            <h1>Crisis <span>Ground Truth</span></h1>
            <p>Validator System</p>
          </div>
        </div>

        <div className="header-right">
          <div className="user-info">
            <div className="user-name">{user?.name || 'Guest'}</div>
            <div className="user-stats">{user?.points || 0} Points • Trust: {trustDisplay}</div>
          </div>
          <button className="icon-btn" onClick={() => {
            localStorage.removeItem('token');
            setUser(null);
          }} title="Logout" style={{ color: 'var(--primary)' }}>
            <LogOut size={20} />
          </button>
          <button className="icon-btn" onClick={() => setShowLeaderboard(!showLeaderboard)}>
            <Trophy size={20} />
          </button>
          <div className="icon-btn" style={{ cursor: 'default' }}>
            <Bell size={20} />
            {notifications.length > 0 && <span className="notification-dot"></span>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Map */}
        <div className="map-container">
          <MapComponent
            center={location || { lat: 18.5204, lng: 73.8567 }}
            reports={reports}
            userLocation={location}
            onMarkerClick={handleReportClick}
            onMapClick={(loc) => showReportForm && setCrisisLocation(loc)}
            selectedCrisisLocation={crisisLocation}
          />
          <div className="map-overlay-buttons">
            <button className="btn btn-primary btn-report" onClick={() => {
              setShowReportForm(true);
              setCrisisLocation(location); // Default to current location
            }}>
              <AlertTriangle size={22} />
              Report Crisis
            </button>
          </div>
        </div>

        {/* Side Panel */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>
              <MapPin size={18} color="var(--primary)" />
              Nearby Incidents
            </h2>
          </div>
          <div className="sidebar-body">
            <ReportList
              reports={reports}
              onReportClick={handleReportClick}
              selectedId={selectedReport?._id}
            />
          </div>
          {/* Verification Panel inside sidebar */}
          {selectedReport && !showReportForm && (
            <VerificationPanel
              report={selectedReport}
              user={user}
              userLocation={location}
              onClose={() => setSelectedReport(null)}
              onUpdate={fetchReports}
            />
          )}
        </aside>

        {/* Report Form */}
        {showReportForm && (
          <ReportForm
            onClose={() => {
              setShowReportForm(false);
              setCrisisLocation(null);
            }}
            user={user}
            location={crisisLocation}
            userLocation={location}
            onDetectLocation={() => setCrisisLocation(location)}
            onSuccess={fetchReports}
          />
        )}

        {/* Leaderboard */}
        {showLeaderboard && (
          <Leaderboard onClose={() => setShowLeaderboard(false)} />
        )}
      </main>

      {/* Toast Notifications */}
      <div className="toast-container">
        {notifications.slice(0, 3).map((n) => (
          <div key={n.id} className="toast">
            <Bell size={18} />
            <span>{n.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
