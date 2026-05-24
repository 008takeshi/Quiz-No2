import { useState, useEffect } from 'react';
import { colors, ui, spacing, fontSize, radius } from '../../../styles/theme';
import logoUrl from '../../../qno2_logo.png';

interface PlayerJoinProps {
  onJoinRoom: (roomCode: string, playerName: string) => void;
  error: string | null;
  roomCodeFromUrl: string | null;
}

export default function PlayerJoin({ onJoinRoom, error, roomCodeFromUrl }: PlayerJoinProps) {
  const [roomCode, setRoomCode] = useState(roomCodeFromUrl || '');
  const [playerName, setPlayerName] = useState('');
  const [step, setStep] = useState<'code' | 'name'>(roomCodeFromUrl ? 'name' : 'code');
  const [loading, setLoading] = useState(false);

  // URLパラメータからルームコードが渡された場合、自動的に名前入力へ
  useEffect(() => {
    if (roomCodeFromUrl && roomCodeFromUrl.length === 6) {
      setRoomCode(roomCodeFromUrl.toUpperCase());
      setStep('name');
    }
  }, [roomCodeFromUrl]);

  const handleRoomCodeSubmit = () => {
    if (roomCode.trim().length === 6) {
      setStep('name');
    }
  };

  const handleJoin = () => {
    if (roomCode.trim().length !== 6) {
      return;
    }

    setLoading(true);
    onJoinRoom(roomCode, playerName);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={logoUrl} alt="Quiz No.2" style={styles.logo} />

        {step === 'code' ? (
          <div style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>ルームコード</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                style={styles.input}
                autoFocus
              />
            </div>

            <button
              onClick={handleRoomCodeSubmit}
              disabled={roomCode.trim().length !== 6}
              style={{ ...styles.button, ...(roomCode.trim().length !== 6 ? styles.buttonDisabled : {}) }}
            >
              次へ
            </button>
          </div>
        ) : (
          <div style={styles.form}>
            <div style={styles.roomCodeDisplay}>
              <span style={styles.roomCodeLabel}>ルームコード</span>
              <span style={styles.roomCodeValue}>{roomCode}</span>
              <button onClick={() => setStep('code')} style={styles.changeButton}>
                変更
              </button>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>あなたの名前</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="空欄の場合は自動で決まります"
                maxLength={20}
                style={styles.input}
                disabled={loading}
                autoFocus
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button
              onClick={handleJoin}
              disabled={loading}
              style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
            >
              {loading ? '参加中...' : '参加する'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { ...ui.pageCenter, background: colors.bgDeep },
  card: ui.card,
  logo: { width: '100%', maxWidth: '360px', display: 'block', margin: `0 auto ${spacing['2']}` },
  subtitle: { fontSize: fontSize.base, textAlign: 'center' as const, marginBottom: spacing['8'], color: colors.textDim },
  form: { display: 'flex', flexDirection: 'column' as const, gap: spacing['5'] },
  formGroup: { display: 'flex', flexDirection: 'column' as const, gap: spacing['2'] },
  label: { fontSize: fontSize.sm, fontWeight: 500, color: colors.textDim },
  input: { padding: spacing['3'], borderRadius: radius.md, border: `1px solid ${colors.border}`, background: colors.bgDeep, color: colors.textSecondary, fontSize: fontSize.base },
  roomCodeDisplay: { background: colors.bgDeep, borderRadius: radius.md, padding: spacing['4'], textAlign: 'center' as const },
  roomCodeLabel: { display: 'block', fontSize: '12px', color: colors.textSecondary, fontWeight: 'bold', marginBottom: spacing['2'] },
  roomCodeValue: { display: 'block', fontSize: fontSize['2xl'], fontWeight: 'bold', letterSpacing: '4px', color: colors.textSecondary, marginBottom: spacing['2'] },
  changeButton: { padding: '6px 12px', borderRadius: radius.sm, border: 'none', fontWeight: 'bold', background: colors.border, color: colors.textSecondary, fontSize: '12px', cursor: 'pointer' },
  button: { ...ui.buttonBlue, padding: '14px', fontSize: fontSize.base, fontWeight: 600 },
  buttonDisabled: { background: colors.neutral, cursor: 'not-allowed' },
  error: { padding: spacing['3'], borderRadius: radius.md, background: colors.redDeep, color: '#fecaca', fontSize: fontSize.sm },
};
