import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Nav from './Nav';
import Chart from './pages/Chart';
import Docs from './pages/Docs';
import Groups from './pages/Groups';
import Heatmap from './pages/Heatmap';
import Home from './pages/Home';
import Sensors from './pages/Sensors';

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main>
        <Routes>
          <Route index element={<Home />} />
          <Route path="heatmap" element={<Heatmap />} />
          <Route path="sensors" element={<Sensors />} />
          <Route path="groups" element={<Groups />} />
          <Route path="chart" element={<Chart />} />
          <Route path="docs" element={<Docs />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
