import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ExerciseCard({ exercise }) {
  return (
    <div className="exercise-card">
      <div className="exercise-top">
        <span className="exercise-name">{exercise.name}</span>
        <div className="exercise-params">
          <span className="exercise-param">Sets: <strong>{exercise.sets}</strong></span>
          <span className="exercise-param">Reps: <strong>{exercise.reps}</strong></span>
          <span className="exercise-param">Rest: <strong>{exercise.restSeconds}s</strong></span>
          {exercise.tempo && <span className="exercise-param">Tempo: <strong>{exercise.tempo}</strong></span>}
        </div>
      </div>

      <div className="muscle-tags">
        {exercise.musclesTrained?.map((muscle, i) => (
          <div key={i} className={`muscle-tag ${muscle.role}`}>
            <span className="muscle-common">{muscle.commonName}</span>
            <span className="muscle-anatomical">{muscle.anatomicalName}</span>
            <span className="muscle-role">{muscle.role}</span>
          </div>
        ))}
      </div>

      {exercise.notes && <div className="exercise-notes">💡 {exercise.notes}</div>}
    </div>
  );
}

function ExerciseSection({ title, icon, exercises, className }) {
  if (!exercises || exercises.length === 0) return null;
  return (
    <div className={className}>
      <div className="section-header">
        <div className="section-icon">{icon}</div>
        <span className="section-title">{title}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 'auto' }}>
          {exercises.length} exercise{exercises.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="exercise-list">
        {exercises.map((ex, i) => <ExerciseCard key={i} exercise={ex} />)}
      </div>
    </div>
  );
}

export default function ViewProgram() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tweaking, setTweaking] = useState(false);
  const [tweakText, setTweakText] = useState('');

  useEffect(() => {
    fetchProgram();
  }, [id]);

  const fetchProgram = async () => {
    try {
      const res = await axios.get(`${API}/programs/${id}`);
      setProgram(res.data);
    } catch (err) {
      alert('Failed to load program');
      navigate('/programs');
    } finally {
      setLoading(false);
    }
  };

  const handleTweak = async () => {
    if (!tweakText.trim()) return;
    setTweaking(true);
    try {
      const res = await axios.post(`${API}/programs/${id}/tweak`, {
        tweakInstructions: tweakText
      });
      setProgram(res.data);
      setTweakText('');
      setActiveDay(0);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to tweak program');
    } finally {
      setTweaking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this program?')) return;
    try {
      await axios.delete(`${API}/programs/${id}`);
      navigate('/programs');
    } catch {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading program...</p>
      </div>
    );
  }

  if (!program) return null;

  const currentDay = program.days?.[activeDay];

  return (
    <>
      {tweaking && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p className="loading-text">🔧 AI is tweaking the program...</p>
        </div>
      )}

      <div className="page-container">
        <div className="program-header">
          <div>
            <h1 className="page-title">{program.clientName}'s Program</h1>
            <div className="program-meta" style={{ marginTop: '0.75rem' }}>
              <span className="program-meta-tag tag-level">📊 {program.fitnessLevel}</span>
              <span className="program-meta-tag tag-split">🏋️ {program.programSplit}</span>
              <span className="program-meta-tag tag-days">📅 {program.daysPerWeek} days/week</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/programs')}>← Back</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑️ Delete</button>
          </div>
        </div>

        {/* Day Tabs */}
        <div className="day-tabs">
          {program.days?.map((day, i) => (
            <button
              key={i}
              className={`day-tab ${activeDay === i ? 'active' : ''}`}
              onClick={() => setActiveDay(i)}
            >
              Day {day.dayNumber}: {day.dayName}
            </button>
          ))}
        </div>

        {/* Current Day Content */}
        {currentDay && (
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📌</span>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    Day {currentDay.dayNumber} — {currentDay.dayName}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Focus: {currentDay.focus}
                  </p>
                </div>
              </div>
            </div>

            <ExerciseSection title="Warm-Up" icon="🔥" exercises={currentDay.warmup} className="section-warmup" />
            <ExerciseSection title="Mobility" icon="🧘" exercises={currentDay.mobility} className="section-mobility" />
            <ExerciseSection title="Strength Training" icon="💪" exercises={currentDay.strength} className="section-strength" />
            <ExerciseSection title="Cool-Down" icon="❄️" exercises={currentDay.cooldown} className="section-cooldown" />
          </div>
        )}

        {/* Rationale */}
        {program.rationale && (
          <div className="card rationale-card">
            <div className="rationale-title">🧠 Training Rationale & Approach</div>
            <div className="rationale-text">{program.rationale}</div>
          </div>
        )}

        {/* Tweak Section */}
        <div className="card tweak-section">
          <h3>🔧 Tweak This Program</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Describe what changes you want — swap exercises, change volume, modify the split, add deload weeks, etc.
          </p>
          <div className="tweak-input-row">
            <textarea
              className="form-textarea"
              value={tweakText}
              onChange={(e) => setTweakText(e.target.value)}
              placeholder='e.g., "Replace barbell bench press with dumbbell press, add more hamstring work on day 2, reduce sets for isolation exercises"'
            />
            <button
              className="btn btn-primary"
              onClick={handleTweak}
              disabled={tweaking || !tweakText.trim()}
              style={{ alignSelf: 'flex-end' }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
