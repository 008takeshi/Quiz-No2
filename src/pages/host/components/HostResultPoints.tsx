import { useSocket } from '../../../contexts/SocketContext';
import { colors, ui, spacing, fontSize } from '../../../styles/theme';

interface Props {
  hasMoreQuizzes: boolean;
}

export default function HostResultPoints({ hasMoreQuizzes }: Props) {
  const { socket } = useSocket();

  const handleNext = () => {
    if (hasMoreQuizzes) socket?.emit('nextQuiz', {});
    else socket?.emit('endGame', {});
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🔒</div>
        <p style={styles.message}>
          順位は最終結果まで発表しません
        </p>
        <p style={styles.sub}>
          {hasMoreQuizzes ? '次の問題に進みましょう' : '全問終了しました'}
        </p>
        <button style={hasMoreQuizzes ? styles.nextButton : styles.endButton} onClick={handleNext}>
          {hasMoreQuizzes ? '次の問題へ →' : '🏆 最終結果を見る'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: ui.pageCenter,
  card: { ...ui.cardBordered, maxWidth: '480px', padding: `${spacing['12']} ${spacing['10']}`, textAlign: 'center' },
  icon: { fontSize: '56px', marginBottom: spacing['5'] },
  message: { fontSize: '22px', fontWeight: 600, color: colors.textPrimary, marginBottom: spacing['2'] },
  sub: { fontSize: fontSize.base, color: colors.textMuted, marginBottom: spacing['10'] },
  nextButton: ui.buttonPrimary,
  endButton: ui.buttonAmber,
};
