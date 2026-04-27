import { Clock, Shield, CheckCircle2, AlertTriangle, XCircle, Info, Trash2 } from 'lucide-react';

const STATUS_ICONS = {
  active: <AlertTriangle size={14} color="#FF3B3B" />,
  verified: <CheckCircle2 size={14} color="#10B981" />,
  uncertain: <Info size={14} color="#F59E0B" />,
  false: <XCircle size={14} color="#6B7280" />,
};

const ReportList = ({ reports, onReportClick, selectedId, onDelete }) => {
  if (reports.length === 0) {
    return (
      <div className="empty-state">
        <Shield size={48} strokeWidth={1} />
        <p>No active reports in this area</p>
      </div>
    );
  }

  return (
    <div className="report-list">
      {reports.map((report) => (
        <div
          key={report._id}
          onClick={() => onReportClick(report)}
          className={`report-item ${selectedId === report._id ? 'selected' : ''}`}
        >
          <div className="report-item-top">
            <span className="report-type-badge">{report.type}</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="report-time">
                <Clock size={10} />
                {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {onDelete && (
                <button
                  className="icon-btn"
                  style={{ color: 'var(--danger)', padding: 0, border: 'none', background: 'none' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(report._id);
                  }}
                  title="Delete Report"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="report-desc">{report.description}</div>

          <div className="report-bottom">
            <span className={`status-chip ${report.status}`}>
              {STATUS_ICONS[report.status]}
              {report.status}
            </span>
            <span className="dot-separator"></span>
            <span className="vote-count">{(report.confirmations || 0) + (report.rejections || 0)} Votes</span>
            <span className="score-badge">Score: {(report.legitimacyScore || 0).toFixed(1)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportList;
