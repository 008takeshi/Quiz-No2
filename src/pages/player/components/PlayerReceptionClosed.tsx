import { colors, ui, spacing, fontSize } from '../../../styles/theme';

export default function PlayerReceptionClosed() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.content}>
          <div style={styles.spinner}></div>
          <h1 style={styles.title}>受付終了</h1>
          <p style={styles.text}>ゲームが始まります...</p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: ui.pageCenter,
  card: { ...ui.card, padding: `${spacing['15']} ${spacing['10']}` },
  content: { textAlign: 'center' },
  spinner: { ...ui.spinner, width: spacing['12'], height: spacing['12'], margin: `0 auto ${spacing['6']}` },
  title: { fontSize: fontSize['3xl'], fontWeight: 'bold', marginBottom: spacing['4'], color: colors.textPrimary },
  text: { fontSize: fontSize.base, color: colors.textDim, lineHeight: '1.5' },
};
