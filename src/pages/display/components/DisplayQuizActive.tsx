import { useState, useEffect } from 'react';
import { colors, choiceBgs, choiceAccents, ui, displayPage, displayFontSize, displaySpacing, radius } from '../../../styles/theme';

interface Props {
  quizNumber: number;
  totalQuizCount: number;
  question: string;
  choices: Array<{ text: string }>;
  endsAt: number;
  closed?: boolean;
}

export default function DisplayQuizActive({ quizNumber, totalQuizCount, question, choices, endsAt, closed }: Props) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));

  useEffect(() => {
    setTimeLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }, 200);
    return () => clearInterval(interval);
  }, [endsAt]);

  const isUrgent = timeLeft <= 5;

  return (
    <div style={{ ...styles.container, position: 'relative' }}>
      <div style={styles.topBar}>
        <span style={styles.badge}>問題 {quizNumber} / {totalQuizCount}</span>
        <div style={styles.timerBox}>
          <span style={{ ...styles.timer, color: isUrgent ? '#f87171' : '#34d399' }}>{timeLeft}</span>
          <span style={styles.timerUnit}>秒</span>
        </div>
      </div>

      <div style={styles.questionArea}>
        <p style={styles.question}>{question}</p>
      </div>

      <div style={styles.choices}>
        {choices.map((c, i) => (
          <div key={i} style={{ ...styles.choice, background: choiceBgs[i], borderColor: choiceAccents[i] }}>
            <span style={{ ...styles.choiceLetter, color: choiceAccents[i] }}>{String.fromCharCode(65 + i)}</span>
            <span style={styles.choiceText}>{c.text}</span>
          </div>
        ))}
      </div>

      {closed && (
        <div style={styles.overlay}>
          <div style={styles.overlayContent}>
            <p style={styles.overlayText}>受付終了</p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageColumn, ...displayPage },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: displaySpacing['4'] },
  badge: { background: '#7b2cbf', color: '#ffd60a', borderRadius: '999px', padding: `clamp(4px, 0.74vh, 8px) clamp(10px, 1.85vh, 20px)`, fontSize: displayFontSize.base, fontWeight: 700, border: '2px solid #ffd60a' },
  timerBox: { display: 'flex', alignItems: 'baseline', gap: displaySpacing['1'] },
  timer: { fontSize: displayFontSize.displayXl, fontWeight: 'bold', fontVariantNumeric: 'tabular-nums', lineHeight: 1, transition: 'color 0.3s' },
  timerUnit: { fontSize: displayFontSize['2xl'], fontWeight: 'bold', color: colors.timerNormal },
  questionArea: { flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingBottom: displaySpacing['5'], overflow: 'hidden' },
  question: { fontSize: displayFontSize['6xl'], fontWeight: 'bold', color: colors.textSecondary, lineHeight: '1.4', maxWidth: 'min(900px, 80vw)' },
  choices: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: displaySpacing['4'] },
  choice: { borderRadius: radius.lg, padding: `${displaySpacing['5']} clamp(14px, 2.6vh, 28px)`, display: 'flex', alignItems: 'center', gap: displaySpacing['4'], border: '2px solid' },
  choiceLetter: { fontSize: displayFontSize['3xl'], fontWeight: 'bold', minWidth: 'clamp(24px, 3.3vh, 36px)' },
  choiceText: { fontSize: displayFontSize['2xl'], color: colors.textSecondary, fontWeight: 600 },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(10, 15, 28, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'inherit' },
  overlayContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: displaySpacing['6'] },
  overlayText: { fontSize: displayFontSize['4xl'], fontWeight: 'bold', color: colors.textSecondary, margin: 0 },
};
