import { useState, useEffect } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import { colors, choiceColors, choiceAccents, choiceLetters, ui, spacing, fontSize, radius } from '../../../styles/theme';

interface Props {
  quizNumber: number;
  choices: Array<{ text: string }>;
  endsAt: number;
  closed?: boolean;
}

export default function PlayerQuizActive({ quizNumber, choices, endsAt, closed }: Props) {
  const { socket } = useSocket();
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));

  useEffect(() => {
    setTimeLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }, 200);
    return () => clearInterval(interval);
  }, [endsAt]);

  const handleSelect = (index: number) => {
    if (answered || closed) return;
    setSelected(index);
    setAnswered(true);
    socket?.emit('submitAnswer', { choiceIndex: index });
  };

  if (answered && selected !== null) {
    const c = choiceColors[selected];
    return (
      <div style={{ ...styles.container, position: 'relative' }}>
        <div style={styles.card}>
          <div style={styles.answeredIcon}>✓</div>
          <p style={styles.answeredText}>回答済み</p>
          <div style={{ ...styles.selectedChoice, background: c.bg, borderColor: c.border }}>
            <span style={{ ...styles.selectedLabel, color: choiceAccents[selected] }}>{choiceLetters[selected]}</span>
            <span style={styles.selectedText}>{choices[selected].text}</span>
          </div>
          <p style={styles.waitText}>結果をお待ちください...</p>
        </div>
        {closed && <div style={styles.overlay}><p style={styles.overlayText}>受付終了</p></div>}
      </div>
    );
  }

  const isUrgent = timeLeft <= 5;

  return (
    <div style={{ ...styles.container, position: 'relative' }}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.badge}>問題 {quizNumber}</span>
          <span style={{ ...styles.timer, color: isUrgent ? '#f87171' : '#34d399' }}>{timeLeft}秒</span>
        </div>
        <p style={styles.prompt}>選択肢を選んでください</p>
        <div style={styles.choices}>
          {choices.map((c, i) => {
            const col = choiceColors[i];
            return (
              <button
                key={i}
                style={{ ...styles.choiceBtn, background: col.bg, border: `2px solid ${col.border}` }}
                onClick={() => handleSelect(i)}
              >
                <span style={{ ...styles.choiceLetter, color: choiceAccents[i] }}>{choiceLetters[i]}</span>
                <span style={styles.choiceText}>{c.text}</span>
              </button>
            );
          })}
        </div>
      </div>
      {closed && <div style={styles.overlay}><p style={styles.overlayText}>受付終了</p></div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageCenter, padding: spacing['4'] },
  card: { ...ui.cardBordered, maxWidth: '420px', padding: `${spacing['8']} ${spacing['6']}` },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['5'] },
  badge: ui.quizBadge,
  timer: { fontSize: fontSize['4xl'], fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' },
  prompt: { fontSize: fontSize.base, color: colors.textDim, textAlign: 'center', marginBottom: spacing['6'] },
  choices: { display: 'flex', flexDirection: 'column', gap: spacing['3'] },
  choiceBtn: { width: '100%', padding: `18px ${spacing['5']}`, borderRadius: radius.lg, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.1s' },
  choiceLetter: { fontSize: '22px', fontWeight: 'bold', minWidth: spacing['7'] },
  choiceText: { fontSize: '17px', fontWeight: '500', color: colors.textSecondary, textAlign: 'left' },
  answeredIcon: { width: fontSize.displayLg, height: fontSize.displayLg, borderRadius: radius.circle, background: colors.greenDeep, color: colors.greenLight, fontSize: fontSize['5xl'], display: 'flex', alignItems: 'center', justifyContent: 'center', margin: `0 auto ${spacing['4']}` },
  answeredText: { fontSize: '22px', fontWeight: 'bold', color: colors.greenLight, textAlign: 'center', marginBottom: spacing['6'] },
  selectedChoice: { borderRadius: radius.lg, padding: `${spacing['4']} ${spacing['5']}`, display: 'flex', alignItems: 'center', gap: '14px', border: '2px solid', marginBottom: spacing['6'] },
  selectedLabel: { fontSize: '22px', fontWeight: 'bold', minWidth: spacing['7'] },
  selectedText: { fontSize: '17px', color: colors.textSecondary },
  waitText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(10, 15, 28, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  overlayText: { fontSize: fontSize['4xl'], fontWeight: 'bold', color: colors.textSecondary, margin: 0 },
};
