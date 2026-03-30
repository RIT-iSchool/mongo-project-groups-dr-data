import { Routes, Route } from 'react-router-dom';
import Home    from './pages/Home';
import Results from './pages/Results';
import Detail  from './pages/Detail';

export default function App() {
  return (
    <Routes>
      <Route path="/"        element={<Home />}    />
      <Route path="/results" element={<Results />} />
      <Route path="/detail"  element={<Detail />}  />
    </Routes>
  );
}