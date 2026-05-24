import { useSocket } from '../../../contexts/SocketContext';
import { colors, ui, spacing, fontSize, fontFamily } from '../../../styles/theme';

export default function HostQuizClosed() {
  const { socket } = useSocket();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.label}>回答締め切り</p>
        <button style={styles.button} onClick={() => socket?.emit('showResults', {})}>
          結果を発表する
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: ui.pageCenter,
  card: { ...ui.card, textAlign: 'center' },
  label: { fontFamily: fontFamily.display, fontSize: fontSize['2xl'], color: colors.textPrimary, marginBottom: spacing['6'] },
  button: ui.buttonBlue,
};
