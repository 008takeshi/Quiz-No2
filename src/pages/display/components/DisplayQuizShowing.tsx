import { GamePhase } from '../../../../types/game';
import { colors, choiceBgs, choiceAccents, ui, displayPage, displayFontSize, displaySpacing, radius } from '../../../styles/theme';

interface Props {
  phase: GamePhase;
  quizNumber: number;
  totalQuizCount: number;
  question: string;
  questionImage?: string;
  choices: Array<{ text: string }>;
}

export default function DisplayQuizShowing({ phase, quizNumber, totalQuizCount, question, questionImage, choices }: Props) {
  const isChoicesPhase = phase === GamePhase.QUIZ_SHOWING_CHOICES;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.badge}>問題 {quizNumber} / {totalQuizCount}</span>
      </div>

      <div style={styles.questionArea}>
        <p style={styles.question}>{question}</p>
        {phase === GamePhase.QUIZ_SHOWING_IMAGE && questionImage && (
          <img src={questionImage} alt="" style={styles.image} />
        )}
      </div>

      {isChoicesPhase && (
        <div style={styles.choices}>
          {choices.map((c, i) => (
            <div key={i} style={{ ...styles.choice, background: choiceBgs[i], borderColor: choiceAccents[i] }}>
              <span style={{ ...styles.choiceLetter, color: choiceAccents[i] }}>{String.fromCharCode(65 + i)}</span>
              <span style={styles.choiceText}>{c.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageColumn, ...displayPage, padding: displaySpacing['10'] },
  header: { marginBottom: displaySpacing['8'] },
  badge: { background: '#7b2cbf', color: '#ffd60a', borderRadius: '999px', padding: `clamp(4px, 0.74vh, 8px) clamp(10px, 1.85vh, 20px)`, fontSize: displayFontSize.base, fontWeight: 700, border: '2px solid #ffd60a' },
  questionArea: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', marginBottom: displaySpacing['10'], overflow: 'hidden' },
  question: { fontSize: displayFontSize['6xl'], fontWeight: 'bold', color: colors.textSecondary, lineHeight: '1.4', maxWidth: 'min(900px, 80vw)' },
  image: { maxWidth: 'min(600px, 55vw)', maxHeight: 'clamp(200px, 32vh, 350px)', borderRadius: radius.lg, marginTop: displaySpacing['8'] },
  choices: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: displaySpacing['4'] },
  choice: { borderRadius: radius.lg, padding: `${displaySpacing['5']} clamp(14px, 2.6vh, 28px)`, display: 'flex', alignItems: 'center', gap: displaySpacing['4'], border: '2px solid' },
  choiceLetter: { fontSize: displayFontSize['3xl'], fontWeight: 'bold', minWidth: 'clamp(24px, 3.3vh, 36px)' },
  choiceText: { fontSize: displayFontSize['2xl'], color: colors.textSecondary, fontWeight: 600 },
};
