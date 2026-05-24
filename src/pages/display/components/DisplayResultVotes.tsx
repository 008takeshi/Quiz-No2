import type { ChoiceStatistics } from '../../../../types/game';
import { colors, choiceAccents, choiceColors, ui, displayPage, displayFontSize, displaySpacing, radius, gradients } from '../../../styles/theme';
import correctIconSrc from '../../../qno2_correct.png';
import secondIconSrc from '../../../qno2_second.png';

interface Props {
  quizNumber: number;
  question: string;
  statistics: ChoiceStatistics[];
  showAnswer: boolean;
  showVotes: boolean;
  explanation?: string;
}

export default function DisplayResultVotes({ quizNumber, question, statistics, showAnswer, showVotes, explanation }: Props) {
  const maxVotes = Math.max(...statistics.map(s => s.voteCount), 1);
  const totalVotes = statistics.reduce((a, s) => a + s.voteCount, 0);

  const phaseLabel = showVotes ? '得票数' : showAnswer ? '正解発表' : '結果発表';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.badge}>問題 {quizNumber}</span>
        <span style={styles.phase}>{phaseLabel}</span>
      </div>

      <div style={styles.questionArea}>
        <p style={styles.question}>{question}</p>
      </div>

      <div style={styles.bars}>
        {statistics.map((s, i) => {
          const isCorrect = showAnswer && s.isCorrect;
          const isSecond = showVotes && s.isSecondPlace;
          const both = isCorrect && isSecond;
          const accentColor = choiceAccents[i];
          const pct = showVotes && maxVotes > 0 ? (s.voteCount / maxVotes) * 100 : 0;
          const votePct = showVotes && totalVotes > 0 ? Math.round((s.voteCount / totalVotes) * 100) : 0;

          return (
            <div key={i} style={styles.barRow}>
              <div style={styles.rowLeft}>
                <span style={{ ...styles.letter, background: choiceColors[i].bg, color: choiceColors[i].label }}>{String.fromCharCode(65 + i)}</span>
                <span style={styles.choiceText}>{s.text}</span>
              </div>
              <div style={styles.barSection}>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, width: `${pct}%`, background: accentColor }} />
                </div>
                <span style={styles.votePct}>{showVotes ? `${votePct}%` : '-%'}</span>
                <span style={styles.voteNum}>{showVotes ? `${s.voteCount}票` : '-票'}</span>
              </div>
              {isCorrect && (
                <img src={correctIconSrc} alt="正解" style={{ ...styles.resultIcon, left: both ? '38%' : '50%' }} />
              )}
              {isSecond && (
                <img src={secondIconSrc} alt="2位" style={{ ...styles.resultIcon, left: both ? '58%' : '50%' }} />
              )}
            </div>
          );
        })}
      </div>

      {showAnswer && explanation && (
        <div style={styles.explanation}>
          <span style={styles.explanationLabel}>解説：</span>{explanation}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageColumn, ...displayPage, padding: displaySpacing['10'] },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: displaySpacing['6'] },
  badge: { background: '#7b2cbf', color: '#ffd60a', borderRadius: '999px', padding: `clamp(4px, 0.74vh, 8px) clamp(10px, 1.85vh, 20px)`, fontSize: displayFontSize.base, fontWeight: 700, border: '2px solid #ffd60a' },
  phase: { fontSize: displayFontSize.lg, color: colors.textMuted },
  questionArea: { background: gradients.card, borderRadius: radius.lg, padding: displaySpacing['6'], marginBottom: displaySpacing['6'], textAlign: 'center' },
  question: { fontSize: displayFontSize['3xl'], color: colors.textDim, fontWeight: 'bold', margin: 0, lineHeight: '1.4' },
  explanation: { background: gradients.card, borderRadius: radius.lg, padding: `${displaySpacing['4']} ${displaySpacing['6']}`, marginTop: displaySpacing['6'], fontSize: displayFontSize['2xl'], color: colors.textPrimary, lineHeight: '1.6', textAlign: 'center' as const },
  explanationLabel: { fontWeight: 700, color: colors.textPrimary, marginRight: displaySpacing['2'] },
  bars: { display: 'flex', flexDirection: 'column', gap: displaySpacing['3'] },
  barRow: { display: 'flex', alignItems: 'center', gap: displaySpacing['5'], padding: `${displaySpacing['3']} ${displaySpacing['5']}`, borderRadius: radius.lg, background: gradients.card, position: 'relative' },
  rowLeft: { width: 'clamp(150px, 22vw, 300px)', display: 'flex', alignItems: 'center', gap: displaySpacing['3'], flexShrink: 0 },
  letter: { fontSize: displayFontSize['2xl'], fontWeight: 'bold', width: 'clamp(28px, 3.7vh, 40px)', height: 'clamp(28px, 3.7vh, 40px)', borderRadius: radius.circle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  choiceText: { fontSize: displayFontSize.lg, fontWeight: 500, color: colors.textDim, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  barSection: { flex: 1, display: 'flex', alignItems: 'center', gap: displaySpacing['3'] },
  barTrack: { flex: 1, height: 'clamp(20px, 3.7vh, 40px)', background: colors.bgDeep, borderRadius: '6px', overflow: 'hidden', boxShadow: '0 0 0 3px #0d001a' },
  barFill: { height: '100%', borderRadius: '6px', transition: 'width 0.6s ease' },
  votePct: { width: 'clamp(32px, 4vh, 44px)', textAlign: 'right', fontSize: displayFontSize.lg, color: colors.textMuted },
  voteNum: { width: 'clamp(40px, 5.2vh, 56px)', textAlign: 'right', fontSize: displayFontSize.base, color: colors.textMuted },
  resultIcon: { position: 'absolute', top: '50%', width: 'clamp(100px, 15vw, 200px)', aspectRatio: '3 / 2', zIndex: 10, pointerEvents: 'none', animation: 'stampIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' },
};
