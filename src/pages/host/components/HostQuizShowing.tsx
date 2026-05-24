import { useSocket } from '../../../contexts/SocketContext';
import { GamePhase } from '../../../../types/game';
import { colors, choiceBgs, choiceAccents, ui, spacing, fontSize, radius } from '../../../styles/theme';

interface Props {
  phase: GamePhase;
  quizNumber: number;
  totalQuizCount: number;
  question: string;
  questionImage?: string;
  choices: Array<{ text: string; image?: string }>;
}

export default function HostQuizShowing({ phase, quizNumber, totalQuizCount, question, questionImage, choices }: Props) {
  const { socket } = useSocket();

  const isChoicesPhase = phase === GamePhase.QUIZ_SHOWING_CHOICES;

  const handleNext = () => {
    if (isChoicesPhase) {
      socket?.emit('startAnswer', {});
    } else {
      socket?.emit('nextQuizShowStep', {});
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.badge}>問題 {quizNumber} / {totalQuizCount}</span>
          <span style={styles.phaseLabel}>
            {phase === GamePhase.QUIZ_SHOWING_QUESTION && '問題文表示中'}
            {phase === GamePhase.QUIZ_SHOWING_IMAGE && '画像表示中'}
            {phase === GamePhase.QUIZ_SHOWING_CHOICES && '選択肢表示中'}
          </span>
        </div>

        <div style={styles.questionBox}>
          <p style={styles.question}>{question}</p>
        </div>

        {phase === GamePhase.QUIZ_SHOWING_IMAGE && questionImage && (
          <div style={styles.imageBox}>
            <img src={questionImage} alt="問題画像" style={styles.image} />
          </div>
        )}

        {isChoicesPhase && (
          <div style={styles.choices}>
            {choices.map((c, i) => (
              <div key={i} style={{ ...styles.choice, background: choiceBgs[i], borderColor: choiceAccents[i] }}>
                <span style={{ ...styles.choiceLabel, color: choiceAccents[i] }}>{String.fromCharCode(65 + i)}</span>
                <span style={styles.choiceText}>{c.text}</span>
              </div>
            ))}
          </div>
        )}

        <button style={isChoicesPhase ? styles.startButton : styles.nextButton} onClick={handleNext}>
          {isChoicesPhase ? '⏱ 回答開始！' : '選択肢表示へ →'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: ui.pageCenter,
  card: ui.cardWide,
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['6'] },
  badge: ui.quizBadge,
  phaseLabel: { fontSize: fontSize.caption, color: colors.textMuted },
  questionBox: { ...ui.insetBox, marginBottom: spacing['6'] },
  question: { fontSize: '22px', color: colors.textSecondary, lineHeight: '1.6', margin: 0 },
  imageBox: { marginBottom: spacing['6'], textAlign: 'center' as const },
  image: { maxWidth: '100%', maxHeight: '300px', borderRadius: radius.md },
  choices: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing['3'], marginBottom: spacing['8'] },
  choice: { borderRadius: radius.lg, padding: `${spacing['4']} ${spacing['5']}`, display: 'flex', alignItems: 'center', gap: spacing['3'], border: '2px solid' },
  choiceLabel: { fontSize: fontSize['2xl'], fontWeight: 'bold', minWidth: spacing['7'] },
  choiceText: { fontSize: fontSize.base, color: colors.textSecondary, fontWeight: 600 },
  nextButton: { width: '100%', padding: '14px', borderRadius: radius.md, border: 'none', background: colors.border, color: colors.textSecondary, fontSize: fontSize.lg, fontWeight: 600, cursor: 'pointer' },
  startButton: ui.buttonGreen,
};

