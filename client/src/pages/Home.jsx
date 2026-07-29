import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">⚡ AI-Powered Training Programs</div>
          <h1 className="hero-title">
            Build <span>Intelligent</span> Training Programs
          </h1>
          <p className="hero-desc">
            Generate evidence-based warmup, mobility, and strength training routines 
            tailored to each client's level. Every exercise includes detailed anatomical 
            muscle breakdowns and scientific rationale.
          </p>
          <div className="hero-actions">
            <Link to="/create" className="btn btn-primary btn-lg">
              🚀 Create New Program
            </Link>
            <Link to="/knowledge" className="btn btn-secondary btn-lg">
              📚 Knowledge Base
            </Link>
            <Link to="/programs" className="btn btn-secondary btn-lg" style={{ border: 'none', background: 'rgba(255,255,255,0.05)' }}>
              📋 View Programs
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">AI</div>
              <div className="hero-stat-label">Powered by Groq</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">1-7</div>
              <div className="hero-stat-label">Days Per Week</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">PDF</div>
              <div className="hero-stat-label">Knowledge Integration</div>
            </div>
          </div>
        </div>
      </section>

      <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="card feature-card">
          <div className="feature-icon" style={{ background: 'rgba(0, 206, 201, 0.15)', color: 'var(--success)' }}>📚</div>
          <h3>Your Knowledge</h3>
          <p>Upload your own training manuals and PDFs. The AI will strictly follow your methodologies.</p>
        </div>
        <div className="card feature-card">
          <div className="feature-icon">🧬</div>
          <h3>Anatomical Precision</h3>
          <p>Every exercise includes detailed muscle breakdowns with Latin anatomical names and role classification.</p>
        </div>
        <div className="card feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Level-Appropriate</h3>
          <p>Programs are intelligently scaled for beginners, intermediate, and advanced athletes.</p>
        </div>
        <div className="card feature-card">
          <div className="feature-icon">🔧</div>
          <h3>Fully Tweakable</h3>
          <p>Use AI to make real-time adjustments — swap exercises, change volume, modify splits instantly.</p>
        </div>
      </div>
    </>
  );
}
