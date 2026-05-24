import { useState, useEffect } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import type { DeleteRoomRequest, ResetGameRequest, SuccessResponse, ErrorResponse } from '../../../../types/events';
import { colors, ui, spacing, fontSize, radius, fontFamily } from '../../../styles/theme';

interface HostOptionsMenuProps {
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  roomCode?: string;
}

export default function HostOptionsMenu({ onClose, buttonRef, roomCode }: HostOptionsMenuProps) {
  const { socket, clearStorage } = useSocket();
  const [showConfirm, setShowConfirm] = useState<'delete' | 'reset' | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>(styles.menu);

  useEffect(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({
        ...styles.menu,
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
        left: 'auto',
        transform: 'none',
      });
    }
  }, [buttonRef]);

  const handleDeleteRoom = () => {
    if (!socket) return;

    setLoading(true);
    const request: DeleteRoomRequest = {};

    socket.emit('deleteRoom', request, (response: SuccessResponse | ErrorResponse) => {
      setLoading(false);
      if ('code' in response) {
        alert(`エラー: ${response.message}`);
      } else {
        // ストレージをクリアしてホームに戻る
        clearStorage();
        window.location.href = '/host';
      }
    });
  };

  const handleResetGame = () => {
    if (!socket) return;

    setLoading(true);
    const request: ResetGameRequest = {};

    socket.emit('resetGame', request, (response: SuccessResponse | ErrorResponse) => {
      setLoading(false);
      if ('code' in response) {
        alert(`エラー: ${response.message}`);
      } else {
        setShowConfirm(null);
        onClose();
      }
    });
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={menuStyle}>
        <h2 style={styles.title}>オプション</h2>

        {showConfirm === null ? (
          <>
            {roomCode && (
              <>
                <button
                  style={styles.button}
                  onClick={() => window.open(`/play?room=${roomCode}`, '_blank')}
                >
                  👤 プレイヤー画面を開く
                </button>
                <p style={styles.hint}>新しいタブでプレイヤー参加画面を開きます（ルーム: {roomCode}）</p>

                <button
                  style={styles.button}
                  onClick={() => window.open(`/display/${roomCode}`, '_blank')}
                >
                  📺 共有画面を開く
                </button>
                <p style={styles.hint}>新しいタブで共有・観戦用の画面を開きます</p>
              </>
            )}

            <button style={{ ...styles.button, marginTop: spacing['4'] }} onClick={() => setShowConfirm('reset')} disabled={loading}>
              🔄 ゲームをリセット
            </button>
            <p style={styles.hint}>ゲーム進行状況をクリアしてロビーに戻ります</p>

            <button style={{ ...styles.button, ...styles.dangerButton }} onClick={() => setShowConfirm('delete')} disabled={loading}>
              🗑️ ルームを削除
            </button>
            <p style={styles.hint}>ルームを完全に削除してホーム画面に戻ります</p>

            <button style={styles.cancelButton} onClick={onClose} disabled={loading}>
              キャンセル
            </button>
          </>
        ) : (
          <>
            <p style={styles.confirmText}>
              {showConfirm === 'delete'
                ? 'ルームを削除してもよろしいですか？\nすべてのプレイヤーが切断されます。'
                : 'ゲームをリセットしてもよろしいですか？\nゲーム進行状況がクリアされ、ロビーに戻ります。'}
            </p>
            <div style={styles.confirmButtons}>
              <button
                style={styles.confirmButton}
                onClick={showConfirm === 'delete' ? handleDeleteRoom : handleResetGame}
                disabled={loading}
              >
                {loading ? '処理中...' : '実行'}
              </button>
              <button style={styles.cancelButton} onClick={() => setShowConfirm(null)} disabled={loading}>
                キャンセル
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', zIndex: 1000 },
  menu: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: colors.bgCard, borderRadius: radius.lg, padding: spacing['8'], minWidth: '400px', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)', zIndex: 1001 },
  title: { fontFamily: fontFamily.display, fontSize: fontSize['2xl'], color: colors.textPrimary, marginBottom: spacing['6'], textAlign: 'center' },
  button: { ...ui.buttonBlue, padding: spacing['4'], marginBottom: spacing['2'], fontSize: fontSize.base, fontWeight: 600, transition: 'background 0.2s' },
  dangerButton: { background: colors.redDark, marginTop: spacing['4'] },
  cancelButton: { ...ui.buttonNeutral, width: '100%', padding: spacing['3'], marginTop: spacing['4'], fontSize: fontSize.sm },
  hint: { fontSize: '12px', color: colors.textDim, marginBottom: spacing['4'], textAlign: 'center' },
  confirmText: { fontSize: fontSize.base, color: colors.textPrimary, marginBottom: spacing['6'], textAlign: 'center', whiteSpace: 'pre-line', lineHeight: '1.6' },
  confirmButtons: { display: 'flex', gap: spacing['3'] },
  confirmButton: { flex: 1, padding: spacing['3'], background: colors.redDark, color: 'white', border: 'none', borderRadius: radius.md, fontSize: fontSize.base, fontWeight: 600, cursor: 'pointer' },
};
