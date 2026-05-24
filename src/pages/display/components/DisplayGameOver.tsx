import type { FinalResult } from '../../../../types/game';
import { colors, fontFamily, displayFontSize, displaySpacing, rankColors, rankEmoji } from '../../../styles/theme';
import bgUrl from '../../../qno2_bg.png';

interface Props {
  finalResult: FinalResult;
}

export default function DisplayGameOver({ finalResult }: Props) {
  const { leaderboard } = finalResult;
  const top3 = leaderboard.filter(e => e.rank <= 3).sort((a, b) => a.rank - b.rank);

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <h1 style={styles.title}>お疲れ様でした！</h1>

        <div style={styles.podium}>
          {top3.map(entry => (
            <div key={entry.playerId} style={{ ...styles.podiumEntry, ...(entry.rank === 1 ? styles.firstEntry : {}) }}>
              <span style={{ ...styles.rankIcon, color: rankColors[entry.rank - 1] }}>
                {rankEmoji[entry.rank - 1]}
              </span>
              <span style={{ ...styles.entryName, ...(entry.rank === 1 ? styles.firstName : {}) }}>
                {entry.playerName}
              </span>
              <span style={{ ...styles.entryScore, ...(entry.rank === 1 ? styles.firstScore : {}) }}>
                {entry.totalScore}pt
              </span>
            </div>
          ))}
        </div>

        <p style={styles.thanks}>ご参加ありがとうございました</p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgDeep,
    backgroundImage: `url(${bgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    boxSizing: 'border-box',
  },
  inner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: displaySpacing['8'],
    animation: 'fadeIn 0.8s ease-out',
    padding: displaySpacing['10'],
  },
  title: {
    fontSize: displayFontSize.displayLg,
    fontFamily: fontFamily.display,
    color: colors.gold,
    margin: 0,
    textAlign: 'center',
    textShadow: '0 0 40px rgba(255,214,10,0.4)',
  },
  podium: {
    display: 'flex',
    flexDirection: 'column',
    gap: displaySpacing['4'],
    width: '100%',
    maxWidth: 'min(600px, 55vh)',
  },
  podiumEntry: {
    display: 'flex',
    alignItems: 'center',
    gap: displaySpacing['5'],
    padding: `${displaySpacing['4']} ${displaySpacing['6']}`,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  firstEntry: {
    background: 'rgba(255,214,10,0.08)',
    border: `1px solid ${colors.goldDeep}`,
    boxShadow: '0 0 24px rgba(255,214,10,0.15)',
  },
  rankIcon: {
    fontSize: displayFontSize['4xl'],
    width: 'clamp(30px, 4.4vh, 48px)',
    flexShrink: 0,
  },
  entryName: {
    flex: 1,
    fontSize: displayFontSize['2xl'],
    color: colors.textSecondary,
    fontFamily: fontFamily.display,
    fontWeight: 'normal',
  },
  firstName: { fontSize: displayFontSize['3xl'] },
  entryScore: { fontSize: displayFontSize['2xl'], color: colors.textMuted, fontWeight: 700 },
  firstScore: { color: colors.gold, fontSize: displayFontSize['3xl'] },
  thanks: {
    fontSize: displayFontSize.lg,
    color: colors.textSecondary,
    fontWeight: 500,
    fontFamily: fontFamily.body,
    letterSpacing: '0.1em',
    margin: 0,
    marginTop: displaySpacing['4'],
  },
};
