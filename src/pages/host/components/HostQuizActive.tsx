import { useState, useEffect } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import { colors, choiceBgs, choiceAccents, gradients, ui, spacing, fontSize, radius } from '../../../styles/theme';

interface Props {
  quizNumber: number;
  totalQuizCount: number;
  question: string;
  choices: Array<{ text: string }>;
  endsAt: number;
  answerCount: number;
  totalPlayers: number;
}

export default function HostQuizActive({ quizNumber, totalQuizCount, question, choices, endsAt, answerCount, totalPlayers }: Props) {
  const { socket } = useSocket();
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));

  useEffect(() => {
    setTimeLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }, 200);
    return () => clearInterval(interval);
  }, [endsAt]);

  const handleClose = () => socket?.emit('closeQuiz', {});
  const pct = totalPlayers > 0 ? (answerCount / totalPlayers) * 100 : 0;
  const isUrgent = timeLeft <= 5;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.badge}>問題 {quizNumber} / {totalQuizCount}</span>
          <span style={{ ...styles.timer, color: isUrgent ? '#f87171' : '#34d399' }}>{timeLeft}秒</span>
        </div>

        <div style={styles.questionBox}>
          <p style={styles.question}>{question}</p>
        </div>

        <div style={styles.choices}>
          {choices.map((c, i) => (
            <div key={i} style={{ ...styles.choice, background: choiceBgs[i], borderColor: choiceAccents[i] }}>
              <span style={{ ...styles.choiceLabel, color: choiceAccents[i] }}>{String.fromCharCode(65 + i)}</span>
              <span style={styles.choiceText}>{c.text}</span>
            </div>
          ))}
        </div>

        <div style={styles.answerSection}>
          <div style={styles.answerInfo}>
            <span style={styles.answerCount}>{answerCount}</span>
            <span style={styles.answerTotal}> / {totalPlayers} 人が回答</span>
          </div>
          <div style={styles.progressBg}>
            <div style={{ ...styles.progressFill, width: `${pct}%` }} />
          </div>
        </div>

        <button style={styles.closeButton} onClick={handleClose}>
          回答を締め切る
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
  timer: { fontSize: fontSize['5xl'], fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' },
  questionBox: { ...ui.insetBox, marginBottom: spacing['6'] },
  question: { fontSize: '22px', color: colors.textSecondary, lineHeight: '1.6', margin: 0 },
  choices: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing['3'], marginBottom: spacing['8'] },
  choice: { borderRadius: radius.lg, padding: `${spacing['4']} ${spacing['5']}`, display: 'flex', alignItems: 'center', gap: spacing['3'], border: '2px solid' },
  choiceLabel: { fontSize: fontSize['2xl'], fontWeight: 'bold', minWidth: spacing['7'] },
  choiceText: { fontSize: fontSize.base, color: colors.textSecondary, fontWeight: 600 },
  answerSection: { ...ui.insetBox, padding: spacing['5'], marginBottom: spacing['6'] },
  answerInfo: { display: 'flex', alignItems: 'baseline', marginBottom: spacing['3'] },
  answerCount: { fontSize: fontSize['4xl'], fontWeight: 'bold', color: colors.timerNormal },
  answerTotal: { fontSize: fontSize.lg, color: colors.textSecondary },
  progressBg: { height: spacing['2'], background: colors.border, borderRadius: radius.sm, overflow: 'hidden' },
  progressFill: { height: '100%', background: gradients.progress, borderRadius: radius.sm, transition: 'width 0.3s ease' },
  closeButton: ui.buttonDanger,
};
