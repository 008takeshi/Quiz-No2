import { colors, ui, displayPage, displayFontSize, displaySpacing } from '../../../styles/theme';

interface Props {
  quizNumber: number;
}

export default function DisplayResultPoints({ quizNumber }: Props) {
  return (
    <div style={styles.container}>
      <span style={styles.badge}>問題 {quizNumber} 終了</span>
      <div style={styles.icon}>🔒</div>
      <p style={styles.text}>順位は最終結果で発表</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageColumn, ...displayPage, alignItems: 'center', justifyContent: 'center', gap: displaySpacing['6'], padding: '0' },
  badge: { background: '#7b2cbf', color: '#ffd60a', borderRadius: '999px', padding: `clamp(4px, 0.74vh, 8px) clamp(10px, 1.85vh, 20px)`, fontSize: displayFontSize.base, fontWeight: 700, border: '2px solid #ffd60a' },
  icon: { fontSize: 'clamp(50px, 7.4vh, 80px)' },
  text: { fontSize: displayFontSize['4xl'], fontWeight: 'bold', color: colors.textSecondary },
};
