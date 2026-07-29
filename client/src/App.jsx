import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateProgram from './pages/CreateProgram';
import ViewProgram from './pages/ViewProgram';
import ProgramsList from './pages/ProgramsList';
import Knowledge from './pages/Knowledge';
import './index.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateProgram />} />
        <Route path="/programs" element={<ProgramsList />} />
        <Route path="/program/:id" element={<ViewProgram />} />
        <Route path="/knowledge" element={<Knowledge />} />
      </Routes>
    </Router>
  );
}

export default App;
