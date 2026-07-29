import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ProgramsList() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await axios.get(`${API}/programs`);
      setPrograms(res.data);
    } catch {
      console.error('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this program?')) return;
    try {
      await axios.delete(`${API}/programs/${id}`);
      setPrograms(prev => prev.filter(p => p._id !== id));
    } catch {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading programs...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">My Programs</h1>
          <p className="page-subtitle">{programs.length} program{programs.length !== 1 ? 's' : ''} created</p>
        </div>
        <Link to="/create" className="btn btn-primary">+ New Program</Link>
      </div>

      {programs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No programs yet</h3>
          <p>Create your first AI-powered training program</p>
          <Link to="/create" className="btn btn-primary">🚀 Create Program</Link>
        </div>
      ) : (
        <div className="programs-grid">
          {programs.map(prog => (
            <div
              key={prog._id}
              className="card program-list-card"
              onClick={() => navigate(`/program/${prog._id}`)}
            >
              <h3>{prog.clientName}</h3>
              <p className="program-info">
                {prog.programSplit} • {prog.daysPerWeek} days/week • {prog.fitnessLevel}
              </p>
              <div className="program-meta" style={{ marginBottom: '0.5rem' }}>
                {prog.goals?.slice(0, 3).map((g, i) => (
                  <span key={i} className="program-meta-tag tag-level" style={{ fontSize: '0.7rem', padding: '3px 10px' }}>{g}</span>
                ))}
              </div>
              <p className="program-date">
                Created {new Date(prog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <div className="program-card-actions">
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>View Program →</button>
                <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, prog._id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
