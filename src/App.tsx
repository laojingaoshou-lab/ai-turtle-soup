import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ParticleBackground } from '@/components/common/ParticleBackground';
import { PageTransition } from '@/components/common/PageTransition';
import { TabBar } from '@/components/layout/TabBar';
import { UserButton } from '@/components/layout/UserButton';
import { WelcomeModal } from '@/components/ui/WelcomeModal';
import HomePage from '@/pages/HomePage';
import ScriptsPage from '@/pages/ScriptsPage';
import ScriptDetailPage from '@/pages/ScriptDetailPage';
import ScriptImportPage from '@/pages/ScriptImportPage';
import GamePage from '@/pages/GamePage';
import MultiplayerGamePage from '@/pages/MultiplayerGamePage';
import LobbyPage from '@/pages/LobbyPage';
import RoomPage from '@/pages/RoomPage';
import SummaryPage from '@/pages/SummaryPage';
import SettingsPage from '@/pages/SettingsPage';
import LoginPage from '@/pages/LoginPage';
import AccountPage from '@/pages/AccountPage';
import { useScriptStore } from '@/stores/scriptStore';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

export default function App() {
  const fetchServerScripts = useScriptStore((s) => s.fetchServerScripts);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const hasSeenWelcome = useSettingsStore((s) => s.hasSeenWelcome);
  const setHasSeenWelcome = useSettingsStore((s) => s.setHasSeenWelcome);
  const location = useLocation();

  useEffect(() => {
    fetchServerScripts();
    checkAuth();
  }, []);

  const showWelcome = !hasSeenWelcome && location.pathname === '/home';

  return (
    <div className="h-full w-full flex flex-col relative">
      <ParticleBackground />
      <UserButton />
      <WelcomeModal open={showWelcome} onClose={() => setHasSeenWelcome(true)} />
      <PageTransition>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/scripts" element={<ScriptsPage />} />
          <Route path="/script/import" element={<ScriptImportPage />} />
          <Route path="/script/:id" element={<ScriptDetailPage />} />
          <Route path="/game/:id" element={<GamePage />} />
          <Route path="/game/multiplayer/:id" element={<MultiplayerGamePage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/room/:code" element={<RoomPage />} />
          <Route path="/summary/:id" element={<SummaryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </PageTransition>
      <TabBar />
    </div>
  );
}
