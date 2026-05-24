import { colors, ui, displayPage, displayFontSize, displaySpacing } from '../../../styles/theme';

export default function DisplayReceptionClosed() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.spinner}></div>
        <h1 style={styles.title}>受付終了</h1>
        <p style={styles.text}>ゲームを開始します...</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageCenter, ...displayPage, color: colors.textPrimary },
  content: { textAlign: 'center', maxWidth: '600px' },
  spinner: { width: 'clamp(40px, 5.9vh, 64px)', height: 'clamp(40px, 5.9vh, 64px)', margin: `0 auto ${displaySpacing['8']}`, border: '6px solid #7b2cbf', borderTop: '6px solid #9d4edd', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  title: { fontSize: displayFontSize.display, fontWeight: 'bold', marginBottom: displaySpacing['4'], color: colors.textSecondary },
  text: { fontSize: displayFontSize.xl, color: colors.textMuted, lineHeight: '1.5' },
};
