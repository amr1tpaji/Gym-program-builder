import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Knowledge() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    try {
      const res = await axios.get(`${API}/knowledge`);
      setDocs(res.data);
    } catch {
      console.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      await axios.post(`${API}/knowledge/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchDocs();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from knowledge base?`)) return;
    try {
      await axios.delete(`${API}/knowledge/${id}`);
      setDocs(prev => prev.filter(d => d._id !== id));
    } catch {
      alert('Failed to delete');
    }
  };

  const formatSize = (chars) => {
    if (chars > 1000000) return `${(chars / 1000000).toFixed(1)}M chars`;
    if (chars > 1000) return `${(chars / 1000).toFixed(1)}K chars`;
    return `${chars} chars`;
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📚</div>
        <h1 className="page-title">Knowledge Base</h1>
        <p className="page-subtitle">
          Upload your training books, research papers, and methodology PDFs.<br />
          The AI will use <strong>only</strong> this material when generating programs.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`card upload-zone ${dragOver ? 'upload-zone-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{ cursor: uploading ? 'wait' : 'pointer' }}
      >
        <input
          type="file"
          ref={fileRef}
          accept=".pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <div className="upload-zone-content">
            <div className="loading-spinner" style={{ width: 40, height: 40, margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--accent-light)', fontWeight: 600 }}>
              Extracting text from PDF...
            </p>
          </div>
        ) : (
          <div className="upload-zone-content">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Drop a PDF here or click to browse
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Supports training manuals, research papers, methodology books (up to 50MB)
            </p>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
        {docs.length > 0 ? (
          <div className="knowledge-status knowledge-status-active">
            <span>✅</span>
            <span>Knowledge Base Active — {docs.length} source{docs.length > 1 ? 's' : ''} loaded. AI will reference these when generating programs.</span>
          </div>
        ) : (
          <div className="knowledge-status knowledge-status-empty">
            <span>💡</span>
            <span>No sources uploaded yet. AI will use its general training knowledge.</span>
          </div>
        )}
      </div>

      {/* Documents List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : docs.length > 0 ? (
        <div className="knowledge-grid">
          {docs.map(doc => (
            <div key={doc._id} className="card knowledge-card">
              <div className="knowledge-card-icon">📕</div>
              <div className="knowledge-card-info">
                <h3 className="knowledge-card-title">{doc.fileName}</h3>
                <div className="knowledge-card-meta">
                  <span>📄 {doc.pageCount} pages</span>
                  <span>📝 {formatSize(doc.charCount)}</span>
                </div>
                <p className="knowledge-card-date">
                  Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(doc._id, doc.fileName)}
                title="Remove from knowledge base"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
