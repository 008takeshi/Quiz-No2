import { useState, useEffect } from 'react';
import type { FinalResult } from '../../../../types/game';
import { colors, rankColors, rankEmoji, displayFontSize, displaySpacing, radius } from '../../../styles/theme';
import { useSocket } from '../../../contexts/SocketContext';
import bgUrl from '../../../qno2_bg.png';
import resultTitleUrl from '../../../qno2_result.png';

interface Props {
  finalResult: FinalResult;
  initialWinnerRevealed?: boolean;
  skipAnimation?: boolean;
}

const REVEAL_INTERVAL_MS = 800;

export default function DisplayFinalResult({ finalResult, initialWinnerRevealed = false, skipAnimation = false }: Props) {
  const { socket } = useSocket();
  const { leaderboard } = finalResult;

  const others = [...leaderboard].filter(e => e.rank !== 1).sort((a, b) => a.rank - b.rank);
  const winner = leaderboard.find(e => e.rank === 1);

  const [visibleCount, setVisibleCount] = useState(() => skipAnimation ? others.length : 0);
  const [winnerVisible, setWinnerVisible] = useState(initialWinnerRevealed);

  useEffect(() => {
    if (visibleCount >= others.length) return;
    const timer = setTimeout(() => setVisibleCount(c => c + 1), REVEAL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [visibleCount, others.length]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => setWinnerVisible(true);
    socket.on('winnerRevealed', handler);
    return () => { socket.off('winnerRevealed', handler); };
  }, [socket]);

  const visibleOthers = others.slice(others.length - visibleCount);

  return (
    <div style={styles.container}>
      <img src={resultTitleUrl} alt="最終結果発表" style={styles.titleImage} />
      <div style={styles.list}>
        {winnerVisible && winner && (
          <div
            key={winner.playerId}
            style={{ ...styles.listItem, ...styles.firstItem, background: '#1c1506', animation: 'winnerReveal 0.6s ease-out' }}
          >
            <span style={{ ...styles.rank, ...styles.firstRank, color: rankColors[0] }}>{rankEmoji[0]}</span>
            <span style={{ ...styles.name, ...styles.firstName }}>{winner.playerName}</span>
            <span style={{ ...styles.score, ...styles.firstScore }}>{winner.totalScore}pt</span>
          </div>
        )}

        {visibleOthers.map((entry, i) => (
          <div
            key={entry.playerId}
            style={{ ...styles.listItem, background: i % 2 === 0 ? '#1e293b' : '#172032', animation: 'slideIn 0.4s ease-out' }}
          >
            <span style={{ ...styles.rank, color: entry.rank <= 3 ? rankColors[entry.rank - 1] : '#64748b' }}>
              {entry.rank <= 3 ? rankEmoji[entry.rank - 1] : `${entry.rank}位`}
            </span>
            <span style={styles.name}>{entry.playerName}</span>
            <span style={styles.score}>{entry.totalScore}pt</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes winnerReveal {
          0%   { opacity: 0; transform: scale(0.8); }
          60%  { transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bgDeep,
    backgroundImage: `url(${bgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    padding: displaySpacing['10'],
    gap: displaySpacing['6'],
    boxSizing: 'border-box',
  },
  titleImage: {
    display: 'block',
    margin: '0 auto',
    maxWidth: 'min(600px, 55vw)',
    width: '80%',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 0.9vh, 10px)' },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: `${displaySpacing['4']} ${displaySpacing['6']}`,
    borderRadius: radius.lg,
    border: '2px solid transparent',
  },
  firstItem: {
    border: `2px solid ${colors.goldDeep}`,
    boxShadow: '0 0 30px rgba(251,191,36,0.2)',
    padding: `${displaySpacing['6']} ${displaySpacing['6']}`,
  },
  rank: { width: 'clamp(44px, 6.5vh, 70px)', fontSize: displayFontSize['3xl'], fontWeight: 'bold' },
  firstRank: { fontSize: displayFontSize['5xl'], width: 'clamp(50px, 7.4vh, 80px)' },
  name: { flex: 1, fontSize: displayFontSize['2xl'], color: colors.textSecondary, fontWeight: 600 },
  firstName: { fontSize: displayFontSize['5xl'], color: colors.textSecondary, fontWeight: 'bold' },
  score: { fontSize: displayFontSize['2xl'], fontWeight: 'bold', color: colors.textSecondary },
  firstScore: { fontSize: displayFontSize['4xl'], color: colors.gold, fontWeight: 'bold' },
};
