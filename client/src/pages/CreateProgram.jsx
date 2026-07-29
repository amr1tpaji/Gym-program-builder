import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GOALS = [
  'Muscle Gain', 'Fat Loss', 'Strength', 'Endurance',
  'Athletic Performance', 'Flexibility', 'General Fitness', 'Rehabilitation'
];

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CreateProgram() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    clientAge: '',
    clientGender: 'male',
    fitnessLevel: 'beginner',
    goals: [],
    injuries: '',
    equipment: '',
    daysPerWeek: 3,
    sessionDuration: 60,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleGoal = (goal) => {
    setForm(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientName || !form.fitnessLevel || form.goals.length === 0) {
      alert('Please fill in client name, fitness level, and select at least one goal.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/programs/generate`, {
        ...form,
        clientAge: Number(form.clientAge),
        daysPerWeek: Number(form.daysPerWeek),
        sessionDuration: Number(form.sessionDuration),
      });
      navigate(`/program/${res.data._id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate program. Check your Groq API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p className="loading-text">🧠 AI is crafting the perfect program...</p>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            This may take 15-30 seconds
          </p>
        </div>
      )}

      <div className="form-page">
        <div className="page-header" style={{ textAlign: 'center' }}>
          <h1 className="page-title">Create Training Program</h1>
          <p className="page-subtitle">Enter your client's details and let AI build the perfect routine</p>
        </div>

        <form onSubmit={handleSubmit} className="card form-card">
          <div className="form-section-title">👤 Client Information</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Client Name *</label>
              <input
                type="text"
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., John Doe"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                name="clientAge"
                value={form.clientAge}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 28"
                min="10"
                max="100"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="clientGender" value={form.clientGender} onChange={handleChange} className="form-select">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fitness Level *</label>
              <select name="fitnessLevel" value={form.fitnessLevel} onChange={handleChange} className="form-select">
                <option value="beginner">Beginner (0-1 year)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="advanced">Advanced (3+ years)</option>
              </select>
            </div>
          </div>

          <div className="form-section-title">🎯 Training Goals</div>
          <div className="form-group">
            <label className="form-label">Select Goals *</label>
            <div className="form-checkbox-group">
              {GOALS.map(goal => (
                <span
                  key={goal}
                  className={`form-chip ${form.goals.includes(goal) ? 'active' : ''}`}
                  onClick={() => toggleGoal(goal)}
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>

          <div className="form-section-title">⚙️ Program Configuration</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Training Days Per Week *</label>
              <select name="daysPerWeek" value={form.daysPerWeek} onChange={handleChange} className="form-select">
                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'day' : 'days'} / week</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Session Duration (minutes)</label>
              <select name="sessionDuration" value={form.sessionDuration} onChange={handleChange} className="form-select">
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="75">75 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Available Equipment</label>
            <input
              type="text"
              name="equipment"
              value={form.equipment}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Full gym, Dumbbells only, Bodyweight only"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Injuries / Limitations</label>
            <textarea
              name="injuries"
              value={form.injuries}
              onChange={handleChange}
              className="form-textarea"
              placeholder="e.g., Lower back pain, Shoulder impingement, Knee issues..."
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            🚀 Generate Program with AI
          </button>
        </form>
      </div>
    </>
  );
}
