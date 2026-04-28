import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { CommandCenter } from './pages/CommandCenter';
import { Shipments } from './pages/Shipments';
import { DisruptionEngine } from './pages/DisruptionEngine';
import { Rerouting } from './pages/Rerouting';
import { AlertsPage } from './pages/AlertsPage';
import { Analytics } from './pages/Analytics';
import { AddShipment } from './pages/AddShipment';
import { useThemeStore } from './store/useThemeStore';
import { useEffect } from 'react';

export default function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/command-center" element={<CommandCenter />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/new-shipment" element={<AddShipment />} />
          <Route path="/disruption-engine" element={<DisruptionEngine />} />
          <Route path="/rerouting" element={<Rerouting />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
