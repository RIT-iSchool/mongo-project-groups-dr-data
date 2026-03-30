import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const [term,   setTerm]   = useState('');
  const [lat,    setLat]    = useState('');
  const [lng,    setLng]    = useState('');
  const [radius, setRadius] = useState('');
  const [showError, setShowError] = useState(false);

  function doSearch() {
    if (!term.trim()) { setShowError(true); return; }
    setShowError(false);
    navigate('/results?q=' + encodeURIComponent(term.trim()));
  }

  function doGeoSearch() {
    if (!lat || !lng || !radius) {
      alert('Please fill in latitude, longitude, and radius.');
      return;
    }
    let url = `/results?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=${encodeURIComponent(radius)}`;
    if (term.trim()) url += '&q=' + encodeURIComponent(term.trim());
    navigate(url);
  }

  function setAndSearch(t) {
    setTerm(t);
    setShowError(false);
    navigate('/results?q=' + encodeURIComponent(t));
  }

  return (
    <div className="page-home">
      <header className="site-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-cross">✛</span>
            <span className="logo-text">ClinicalSearch</span>
          </div>
          <span className="header-tag">ISTE-438 &nbsp;·&nbsp; Group 3: Dr. Data &nbsp;·&nbsp; RIT 2026</span>
        </div>
      </header>

      <main className="home-main">
        <div className="hero">
          <div className="hero-eyebrow">US Clinical Trial Database</div>
          <h1 className="hero-title">Search Thousands<br />of Clinical Trials</h1>
          <p className="hero-sub">
            Partial-word, case-insensitive search across conditions,<br />
            interventions, sponsors, and more.
          </p>
        </div>

        <div className="search-card">
          {/* Keyword search */}
          <div className="search-section">
            <label className="field-label">Keyword Search</label>
            <div className="input-row">
              <input
                type="text"
                className="main-input"
                placeholder="e.g. cardiac, diabet, melanoma…"
                value={term}
                onChange={e => { setTerm(e.target.value); setShowError(false); }}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                autoComplete="off"
              />
              <button className="btn-primary" onClick={doSearch}>
                <span className="btn-icon">→</span> Search
              </button>
            </div>
            {showError && <div className="error-msg">Please enter a search term.</div>}
          </div>

          <div className="divider"><span>or search by location</span></div>

          {/* Geo search */}
          <div className="search-section geo-section">
            <label className="field-label">Geospatial Search</label>
            <div className="geo-grid">
              <div className="geo-field">
                <label className="sub-label">Latitude</label>
                <input type="text" className="geo-input" placeholder="e.g. 40.7128" value={lat} onChange={e => setLat(e.target.value)} />
              </div>
              <div className="geo-field">
                <label className="sub-label">Longitude</label>
                <input type="text" className="geo-input" placeholder="e.g. -74.0060" value={lng} onChange={e => setLng(e.target.value)} />
              </div>
              <div className="geo-field">
                <label className="sub-label">Radius (miles)</label>
                <input type="text" className="geo-input" placeholder="e.g. 50" value={radius} onChange={e => setRadius(e.target.value)} />
              </div>
            </div>
            <p className="geo-hint">Combine with a keyword above to filter results by condition within the area.</p>
            <button className="btn-secondary" onClick={doGeoSearch}>
              ◆ Search by Location
            </button>
          </div>
        </div>

        <div className="hint-chips">
          <span className="chip-label">Try:</span>
          {['cardiac', 'diabet', 'cancer', 'alzheimer', 'depression'].map(t => (
            <button key={t} className="chip" onClick={() => setAndSearch(t)}>{t}</button>
          ))}
        </div>
      </main>
    </div>
  );
}