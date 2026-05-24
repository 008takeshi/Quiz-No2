import { colors, ui, spacing, fontSize, fontFamily } from '../../../styles/theme';

export default function PlayerGameOver() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>お疲れ様でした！</h1>
        <p style={styles.thanks}>ご参加ありがとうございました</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageCenter, padding: spacing['4'] },
  card: {
    background: 'linear-gradient(160deg, #98F5E1, #e9edc9)',
    borderRadius: '20px',
    padding: `${spacing['10']} ${spacing['6']}`,
    maxWidth: '360px',
    width: '100%',
    border: `2px solid ${colors.border}`,
    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing['5'],
  },
  heading: {
    fontSize: fontSize['4xl'],
    fontFamily: fontFamily.display,
    fontWeight: 'normal',
    color: colors.textPrimary,
    margin: 0,
  },
  thanks: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    fontWeight: 500,
    margin: 0,
    opacity: 0.7,
  },
};
