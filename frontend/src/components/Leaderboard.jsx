import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, X, User } from 'lucide-react';

const rawApiUrl = import.meta.env.VITE_API_URL || 'https://crisis-misinformation-detector.onrender.com/api';
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

const Leaderboard = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/users/leaderboard`);
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-header-left">
            <Trophy size={28} />
            <h2>Top Responders</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-text">Loading Rankings...</div>
          ) : users.length === 0 ? (
            <div className="loading-text">No users yet. Be the first responder!</div>
          ) : (
            users.map((u, index) => (
              <div key={u._id} className="leaderboard-item">
                <div className="rank-display">
                  {index < 3 ? (
                    <Medal size={28} color={index === 0 ? '#EAB308' : index === 1 ? '#9CA3AF' : '#F97316'} />
                  ) : (
                    <span>#{index + 1}</span>
                  )}
                </div>

                <div className="user-avatar">
                  <User size={22} />
                </div>

                <div className="leaderboard-user-info">
                  <div className="leaderboard-user-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {u.name || u.username}
                    {u.badges && u.badges.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {u.badges.map(b => (
                          <span key={b} title={b} style={{ fontSize: '10px', padding: '2px 6px', background: '#FEF2F2', color: '#EF4444', borderRadius: '10px', border: '1px solid #FCA5A5' }}>
                            {b === 'Top Verifier' ? '⭐' : b === 'Local Hero' ? '🦸' : '🛡️'} {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="trust-bar-container">
                    <span className="trust-bar-label">Trust</span>
                    <div className="trust-bar">
                      <div className="trust-bar-fill" style={{ width: `${u.trustScore * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="leaderboard-points">
                  <div className="leaderboard-points-value">{u.points}</div>
                  <div className="leaderboard-points-label">Points</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer">
          <p>"Verified users are the backbone of community safety."</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
