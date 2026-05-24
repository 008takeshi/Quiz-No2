import { Routes, Route, Navigate } from 'react-router-dom';
import HostApp from './pages/host/HostApp';
import PlayerApp from './pages/player/PlayerApp';
import DisplayApp from './pages/display/DisplayApp';

function App() {
  return (
    <Routes>
      {/* ホストSPA - 単一URL */}
      <Route path="/host" element={<HostApp />} />

      {/* プレイヤーSPA - 単一URL */}
      <Route path="/play" element={<PlayerApp />} />

      {/* 共有画面SPA - 単一URL */}
      <Route path="/display/:roomCode" element={<DisplayApp />} />

      {/* デフォルト */}
      <Route path="/" element={<Navigate to="/play" replace />} />
    </Routes>
  );
}

export default App;
