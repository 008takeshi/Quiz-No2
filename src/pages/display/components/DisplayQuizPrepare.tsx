import { colors, ui, displayPage, displayFontSize, displaySpacing } from '../../../styles/theme';

interface Props {
  quizNumber: number;
  totalQuizCount: number;
}

export default function DisplayQuizPrepare({ quizNumber, totalQuizCount }: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.badge}>問題 {quizNumber} / {totalQuizCount}</div>
        <div style={styles.spinner} />
        <p style={styles.text}>次の問題を準備中...</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageCenterGradient, ...displayPage, padding: '0' },
  content: { textAlign: 'center' },
  badge: { background: '#7b2cbf', color: '#ffd60a', borderRadius: '999px', display: 'inline-block', padding: `clamp(4px, 0.74vh, 8px) clamp(12px, 2.2vh, 24px)`, fontSize: displayFontSize.base, fontWeight: 700, border: '2px solid #ffd60a', marginBottom: displaySpacing['8'] },
  spinner: { width: 'clamp(40px, 5.9vh, 64px)', height: 'clamp(40px, 5.9vh, 64px)', margin: `0 auto ${displaySpacing['6']}`, border: '6px solid #7b2cbf', borderTop: '6px solid #9d4edd', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  text: { fontSize: displayFontSize['2xl'], color: colors.textSecondary },
};
