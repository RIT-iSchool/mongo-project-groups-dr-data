import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://172.16.0.66:5000';

export default function Detail() {
  const [searchParams]   = useSearchParams();
  const navigate         = useNavigate();
  const studyId          = searchParams.get('id');

  const [study,        setStudy]        = useState(null);
  const [status,       setStatus]       = useState('loading'); // loading | ok | error
  const [activeTab,    setActiveTab]    = useState('overview');
  const [headerSearch, setHeaderSearch] = useState('');

  // Comment form
  const [commenterName, setCommenterName] = useState('');
  const [commentText,   setCommentText]   = useState('');
  const [feedback,      setFeedback]      = useState({ msg: '', type: '' });

  useEffect(() => {
    if (!studyId) { setStatus('error'); return; }

    fetch(`${API}/api/studies/${encodeURIComponent(studyId)}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setStudy(data); setStatus('ok'); })
      .catch(() => setStatus('error'));
  }, [studyId]);

  async function submitComment() {
    if (!commentText.trim()) {
      setFeedback({ msg: 'Please write a comment before submitting.', type: 'err' });
      return;
    }
    try {
      const res = await fetch(`${API}/api/studies/${encodeURIComponent(studyId)}/comment`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ author: commenterName.trim() || 'Anonymous', text: commentText.trim() }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setStudy(updated);
      setCommentText('');
      setCommenterName('');
      setFeedback({ msg: '✓ Comment posted!', type: 'ok' });
      setActiveTab('comments');
      setTimeout(() => setFeedback({ msg: '', type: '' }), 3000);
    } catch {
      setFeedback({ msg: 'Failed to post comment. Try again.', type: 'err' });
    }
  }

  function doNewSearch() {
    if (headerSearch.trim()) navigate('/results?q=' + encodeURIComponent(headerSearch.trim()));
  }

  // ── Loading / error states ─────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="page-detail">
        <SiteHeader headerSearch={headerSearch} setHeaderSearch={setHeaderSearch} doNewSearch={doNewSearch} />
        <div className="detail-main">
          <div className="loading-state full-loading">
            <div className="spinner" />
            <p>Loading study…</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error' || !study) {
    return (
      <div className="page-detail">
        <SiteHeader headerSearch={headerSearch} setHeaderSearch={setHeaderSearch} doNewSearch={doNewSearch} />
        <div className="detail-main">
          <div className="error-state">
            <p>⚠ Could not load this study. <a href="#" onClick={() => navigate(-1)}>Go back</a></p>
          </div>
        </div>
      </div>
    );
  }

  // ── Study data ─────────────────────────────────────────────────────────────
  const title      = study.Study_Title || study.Brief_Title || 'Untitled Study';
  const phase      = study.Phases         || 'Phase Unknown';
  const studyStatus = study.Overall_Status || '';
  const statusClass = studyStatus.toLowerCase().replace(/\s+/g, '-');
  const comments   = study.comments || [];

  const metaItems = [
    { label: 'NCT Number',   val: study.NCT_Number },
    { label: 'Sponsor',      val: study.Lead_Sponsor_Name },
    { label: 'Start Date',   val: study.Start_Date },
    { label: 'Completion',   val: study.Completion_Date || study.Primary_Completion_Date },
    { label: 'Study Type',   val: study.Study_Type },
    { label: 'Enrollment',   val: study.Enrollment ? study.Enrollment + ' participants' : null },
  ].filter(m => m.val);

  const locations = study.Locations
    ? study.Locations.split('|').map(l => l.trim()).filter(Boolean)
    : [];

  const infoCards = [
    { label: 'Primary Outcome',   val: study.Primary_Outcome_Measures },
    { label: 'Secondary Outcome', val: study.Secondary_Outcome_Measures },
    { label: 'Funded By',         val: study.Funded_Bys },
  ].filter(c => c.val);

  const eligItems = [
    { label: 'Minimum Age', val: study.Minimum_Age },
    { label: 'Maximum Age', val: study.Maximum_Age },
    { label: 'Sex',         val: study.Sex },
    { label: 'Healthy Volunteers', val: study.Accepts_Healthy_Volunteers },
  ].filter(e => e.val);

  const imageUrl = study.image_file_id
    ? `${API}/api/images/${study.image_file_id}`
    : `${API}/api/images/default`;

  return (
    <div className="page-detail">
      <SiteHeader headerSearch={headerSearch} setHeaderSearch={setHeaderSearch} doNewSearch={doNewSearch} />

      <main className="detail-main">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="bc-sep">›</span>
          <a href="#" onClick={e => { e.preventDefault(); navigate(-1); }}>Results</a>
          <span className="bc-sep">›</span>
          <span>{title.length > 60 ? title.slice(0, 60) + '…' : title}</span>
        </nav>

        {/* Hero */}
        <div className="detail-hero">
          <div className="detail-hero-text">
            <div className="detail-badges">
              <span className="badge badge-phase">{phase}</span>
              <span className={`badge badge-status ${statusClass}`}>{studyStatus}</span>
            </div>
            <h1 className="detail-title">{title}</h1>
            {study.Conditions && <p className="detail-condition">{study.Conditions}</p>}
            <div className="detail-meta-grid">
              {metaItems.map(m => (
                <div className="meta-item" key={m.label}>
                  <span className="meta-label">{m.label}</span>
                  <span className="meta-val">{m.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="detail-hero-image">
            <img src={imageUrl} alt="Condition illustration" onError={e => e.target.style.display = 'none'} />
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { id: 'overview',    label: 'Overview' },
            { id: 'eligibility', label: 'Eligibility' },
            { id: 'locations',   label: 'Locations' },
            { id: 'comments',    label: 'Comments', badge: comments.length },
          ].map(t => (
            <button
              key={t.id}
              className={`tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              {t.badge !== undefined && <span className="tab-badge">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="tab-panel">
            <h2 className="section-heading">Brief Summary</h2>
            <p className="detail-body">{study.Brief_Summary || study.Detailed_Description || 'No summary available.'}</p>

            <h2 className="section-heading" style={{ marginTop: 32 }}>Interventions</h2>
            <p className="detail-body">{study.Interventions || 'Not specified.'}</p>

            {infoCards.length > 0 && (
              <div className="detail-info-cards">
                {infoCards.map(c => (
                  <div className="info-card" key={c.label}>
                    <h4 className="info-card-label">{c.label}</h4>
                    <p className="info-card-val">{c.val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Eligibility */}
        {activeTab === 'eligibility' && (
          <div className="tab-panel">
            <h2 className="section-heading">Eligibility Criteria</h2>
            <p className="detail-body">{study.Eligibility_Criteria || 'Not specified.'}</p>
            {eligItems.length > 0 && (
              <div className="eligibility-grid">
                {eligItems.map(e => (
                  <div className="elig-item" key={e.label}>
                    <span className="elig-label">{e.label}</span>
                    <span className="elig-val">{e.val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Locations */}
        {activeTab === 'locations' && (
          <div className="tab-panel">
            <h2 className="section-heading">Trial Locations</h2>
            {locations.length > 0 ? (
              <div className="locations-list">
                {locations.map((loc, i) => (
                  <div className="location-item" key={i}>
                    <span>⌖</span> {loc}
                  </div>
                ))}
              </div>
            ) : (
              <p className="detail-body">No location data available.</p>
            )}
          </div>
        )}

        {/* Comments */}
        {activeTab === 'comments' && (
          <div className="tab-panel">
            <h2 className="section-heading">Comments</h2>

            <div className="comments-list">
              {comments.length === 0
                ? <p className="detail-body no-comments">No comments yet. Be the first to add one.</p>
                : comments.map((c, i) => {
                    const date = c.date
                      ? new Date(c.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '';
                    return (
                      <div className="comment-item" key={i}>
                        <div className="comment-header">
                          <span className="comment-author">{c.author || 'Anonymous'}</span>
                          {date && <span className="comment-date">{date}</span>}
                        </div>
                        <p className="comment-body">{c.text || c.comment || ''}</p>
                      </div>
                    );
                  })
              }
            </div>

            <div className="add-comment-box">
              <h3 className="add-comment-title">Add a Comment</h3>
              <input
                type="text"
                className="side-input"
                placeholder="Your name (optional)"
                value={commenterName}
                onChange={e => setCommenterName(e.target.value)}
              />
              <textarea
                className="comment-textarea"
                placeholder="Share observations, notes, or context about this trial…"
                rows={4}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button className="btn-primary comment-submit" onClick={submitComment}>Post Comment</button>
                {feedback.msg && (
                  <span className={`comment-feedback feedback-${feedback.type}`}>{feedback.msg}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Shared header sub-component ──────────────────────────────────────────────
function SiteHeader({ headerSearch, setHeaderSearch, doNewSearch }) {
  const navigate = useNavigate();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-cross">✛</span>
          <span className="logo-text">ClinicalSearch</span>
        </Link>
        <div className="header-search-bar">
          <input
            type="text"
            className="header-input"
            placeholder="New search…"
            value={headerSearch}
            onChange={e => setHeaderSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doNewSearch()}
            autoComplete="off"
          />
          <button className="btn-header-search" onClick={doNewSearch}>→</button>
        </div>
        <span className="header-tag">ISTE-438 &nbsp;·&nbsp; Group 3: Dr. Data</span>
      </div>
    </header>
  );
}