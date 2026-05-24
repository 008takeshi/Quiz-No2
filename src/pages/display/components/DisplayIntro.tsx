import { colors, ui, displayPage, gradients, displayFontSize, displaySpacing, radius, fontFamily } from '../../../styles/theme';
import logoUrl from '../../../qno2_logo.png';

interface DisplayIntroProps {
  playerCount: number;
  totalQuizCount: number;
}

export default function DisplayIntro({ playerCount, totalQuizCount }: DisplayIntroProps) {

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <img src={logoUrl} alt="Quiz No.2" style={styles.logo} />
        </div>

        <div style={styles.rulesBox}>
          <h2 style={styles.rulesTitle}>ルール</h2>
          <div style={styles.rulesGrid}>
            <div style={styles.ruleCard}>
              <div style={styles.ruleIcon}>📋</div>
              <div style={styles.ruleText}>
                <h3 style={styles.ruleTitle}>4択クイズ</h3>
                <p style={styles.ruleDesc}>選択肢から時間内に回答を選んでください</p>
              </div>
            </div>
            <div style={styles.ruleCard}>
              <div style={styles.ruleIcon}>✅</div>
              <div style={styles.ruleText}>
                <h3 style={styles.ruleTitle}>正解 → 1pt</h3>
                <p style={styles.ruleDesc}>正解の選択肢を選ぶと1ポイント</p>
              </div>
            </div>
            <div style={styles.ruleCard}>
              <div style={styles.ruleIcon}>🥈</div>
              <div style={styles.ruleText}>
                <h3 style={styles.ruleTitle}>2番目に多く選ばれた → 2pt</h3>
                <p style={styles.ruleDesc}>正解より高い得点も狙える！</p>
              </div>
            </div>
            <div style={styles.ruleCard}>
              <div style={styles.ruleIcon}>🏆</div>
              <div style={styles.ruleText}>
                <h3 style={styles.ruleTitle}>正解かつ2位 → 3pt</h3>
                <p style={styles.ruleDesc}>最高点！戦略的に回答を選ぼう</p>
              </div>
            </div>
          </div>
          <p style={styles.victoryText}>全{totalQuizCount}問の中でより多くの得点を稼いだプレイヤーの勝利！</p>
        </div>

        <div style={styles.statsBox}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>プレイヤー総数</span>
            <span style={styles.statValue}>{playerCount}名</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageCenterGradient, ...displayPage, padding: displaySpacing['10'], color: colors.textPrimary, background: gradients.bgPage },
  content: { width: '100%', maxWidth: 'min(1200px, 95vw)', maxHeight: '100%', overflowY: 'auto', textAlign: 'center', boxSizing: 'border-box' as const },
  header: { marginBottom: displaySpacing['8'] },
  logo: { width: 'clamp(280px, 45vh, 580px)', display: 'block', margin: `0 auto ${displaySpacing['6']}`, animation: 'bounce 2s ease-in-out infinite' },
  subtitle: { fontFamily: fontFamily.display, fontSize: displayFontSize['2xl'], color: colors.textSecondary, letterSpacing: '2px' },
  statsBox: { background: 'rgba(15, 23, 42, 0.7)', borderRadius: radius.xl, padding: displaySpacing['6'], marginBottom: displaySpacing['8'], border: `2px solid ${colors.border}` },
  statItem: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: displaySpacing['6'] },
  statLabel: { fontSize: displayFontSize['2xl'], color: colors.textSecondary },
  statValue: { fontSize: displayFontSize['2xl'], fontWeight: 'bold', color: colors.textSecondary },
  rulesBox: { marginBottom: displaySpacing['8'] },
  rulesTitle: { fontFamily: fontFamily.display, fontSize: displayFontSize.displayLg, marginBottom: displaySpacing['6'], color: colors.textSecondary, fontWeight: 'normal' },
  rulesGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: displaySpacing['5'] },
  ruleCard: { background: 'rgba(15, 23, 42, 0.7)', borderRadius: radius.lg, padding: displaySpacing['5'], border: `2px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: displaySpacing['4'], textAlign: 'left' },
  ruleIcon: { fontSize: displayFontSize.display, flexShrink: 0 },
  ruleText: { flex: 1 },
  ruleTitle: { fontSize: displayFontSize['2xl'], fontWeight: 'bold', marginBottom: '4px', color: colors.textSecondary },
  ruleDesc: { fontSize: displayFontSize.base, color: colors.textSecondary, margin: 0 },
  victoryText: { marginTop: displaySpacing['5'], fontSize: displayFontSize['2xl'], fontWeight: 600, color: colors.textSecondary, textAlign: 'center' },
};
