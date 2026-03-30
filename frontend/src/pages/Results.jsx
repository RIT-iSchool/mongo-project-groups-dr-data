import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE_URL || ''; 
const PAGE_SIZE = 15;

export default function Results() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();

  const qParam      = searchParams.get('q')      || '';
  const latParam    = searchParams.get('lat')    || '';
  const lngParam    = searchParams.get('lng')    || '';
  const radiusParam = searchParams.get('radius') || '';

  // Sidebar state (pre-filled from URL)
  const [sideQ,      setSideQ]      = useState(qParam);
  const [sideLat,    setSideLat]    = useState(latParam);
  const [sideLng,    setSideLng]    = useState(lngParam);
  const [sideRadius, setSideRadius] = useState(radiusParam);
  const [headerSearch, setHeaderSearch] = useState('');

  // Results state
  const [allResults,   setAllResults]   = useState([]);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [status,       setStatus]       = useState('loading'); // loading | ok | error | empty

  // Re-sync sidebar inputs when URL changes
  useEffect(() => {
    setSideQ(qParam);
    setSideLat(latParam);
    setSideLng(lngParam);
    setSideRadius(radiusParam);
  }, [qParam, latParam, lngParam, radiusParam]);

  // Fetch whenever URL params change
  useEffect(() => {
    let apiUrl;
    if (latParam && lngParam && radiusParam) {
      apiUrl = `${API}/api/search/geo?lat=${encodeURIComponent(latParam)}&lng=${encodeURIComponent(lngParam)}&radius=${encodeURIComponent(radiusParam)}`;
      if (qParam) apiUrl += `&q=${encodeURIComponent(qParam)}`;
    } else if (qParam) {
      apiUrl = `${API}/api/search?q=${encodeURIComponent(qParam)}`;
    } else {
      setStatus('empty');
      return;
    }

    setStatus('loading');
    setCurrentPage(1);

    fetch(apiUrl)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        setAllResults(data);
        setStatus(data.length === 0 ? 'empty' : 'ok');
      })
      .catch(() => setStatus('error'));
  }, [qParam, latParam, lngParam, radiusParam]);

  // Build label for results header
  let queryLabel = '';
  if (qParam)      queryLabel += `"${qParam}"`;
  if (latParam)    queryLabel += (queryLabel ? ' · ' : '') +
    `within ${radiusParam} mi of (${parseFloat(latParam).toFixed(3)}, ${parseFloat(lngParam).toFixed(3)})`;

  // Pagination
  const total      = allResults.length;
  const pages      = Math.ceil(total / PAGE_SIZE);
  const start      = (currentPage - 1) * PAGE_SIZE;
  const pageSlice  = allResults.slice(start, start + PAGE_SIZE);

  function doNewSearch() {
    if (headerSearch.trim()) navigate('/results?q=' + encodeURIComponent(headerSearch.trim()));
  }

  function doRefine() {
    if (!sideQ.trim() && !(sideLat && sideLng && sideRadius)) {
      alert('Please enter a keyword or complete location fields.');
      return;
    }
    let url = '/results?';
    if (sideQ.trim())                          url += `q=${encodeURIComponent(sideQ.trim())}&`;
    if (sideLat && sideLng && sideRadius)      url += `lat=${encodeURIComponent(sideLat)}&lng=${encodeURIComponent(sideLng)}&radius=${encodeURIComponent(sideRadius)}`;
    navigate(url);
  }

  function changePage(dir) {
    setCurrentPage(p => p + dir);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="page-results">
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

      <main className="results-main">
        {/* Sidebar */}
        <aside className="results-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">Refine Search</h3>

            <label className="field-label">Keyword</label>
            <input type="text" className="side-input" placeholder="condition, sponsor…"
              value={sideQ} onChange={e => setSideQ(e.target.value)} />

            <label className="field-label" style={{ marginTop: 14 }}>Location</label>
            <input type="text" className="side-input" placeholder="Latitude"
              value={sideLat} onChange={e => setSideLat(e.target.value)} />
            <input type="text" className="side-input" placeholder="Longitude"
              value={sideLng} onChange={e => setSideLng(e.target.value)} style={{ marginTop: 6 }} />
            <input type="text" className="side-input" placeholder="Radius (miles)"
              value={sideRadius} onChange={e => setSideRadius(e.target.value)} style={{ marginTop: 6 }} />

            <button className="btn-sidebar" onClick={doRefine}>Apply</button>
            <Link to="/" className="sidebar-reset">← New Search</Link>
          </div>
        </aside>

        {/* Results panel */}
        <section className="results-panel">
          <div className="results-header">
            {status === 'ok' && (
              <>
                <span className="results-count">{total.toLocaleString()} result{total !== 1 ? 's' : ''}</span>
                {queryLabel && <span className="results-query">for {queryLabel}</span>}
              </>
            )}
          </div>

          {status === 'loading' && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Searching clinical trials…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="error-state">
              <p>⚠ Could not load results. Make sure the server is running.</p>
            </div>
          )}

          {status === 'empty' && (
            <div className="empty-state">
              <p className="empty-icon">⚬</p>
              <p>No trials found matching your criteria.</p>
              <Link to="/" className="btn-secondary" style={{ display: 'inline-block', marginTop: 16 }}>
                Try another search
              </Link>
            </div>
          )}

          {status === 'ok' && (
            <>
              <ul className="results-list">
                {pageSlice.map((study, i) => {
                  const snippet = study.snippet;
                  const title   = study.title;
                  const condition = study.condition;
                  const sponsor   = study.sponsor;
                  const location  = study.location;
                  const nctId     = study.nctId;
                  const phase     = study.phase;
                  const status    = study.status;
                                
                  return (
                    <li
                      key={study._id}
                      className="result-card"
                      style={{ animationDelay: `${i * 40}ms` }}
                      onClick={() => navigate('/detail?id=' + encodeURIComponent(study._id))}
                    >
                      <div className="card-meta-row">
                        <span className="card-phase">{phase}</span>
                        <span className={`card-status ${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
                      </div>
                      
                      <h2 className="card-title">{title}</h2>
                      {condition && <p className="card-condition">{condition}</p>}
                      {snippet   && <p className="card-snippet">{snippet}</p>}
                      
                      <div className="card-footer">
                        {sponsor  && <span className="card-footer-item">◆ {sponsor}</span>}
                        {location && <span className="card-footer-item">⌖ {location}</span>}
                        {nctId    && <span className="card-footer-item card-nct">{nctId}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {pages > 1 && (
                <div className="pagination-bar">
                  <button className="btn-page" onClick={() => changePage(-1)} disabled={currentPage === 1}>← Prev</button>
                  <span className="page-info">Page {currentPage} of {pages}</span>
                  <button className="btn-page" onClick={() => changePage(1)}  disabled={currentPage === pages}>Next →</button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}