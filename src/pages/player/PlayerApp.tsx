import React, { useState, useEffect, useRef } from 'react';
import { colors, ui, spacing, fontSize } from '../../styles/theme';
import { useSearchParams } from 'react-router-dom';
import { SocketProvider, useSocket } from '../../contexts/SocketContext';
import { createSocket } from '../../lib/socket';
import { GamePhase } from '../../../types/game';
import type {
  JoinRoomRequest,
  JoinRoomResponse,
  ErrorResponse,
  PhaseChangedEvent,
  QuizActiveEvent,
  QuizChoicesShowEvent,
  ResultVotesShowEvent,
  ResultAnswerShowEvent,
  ResultPointsShowEvent,
  FinalResultEvent,
  StateSyncEvent,
} from '../../../types/events';
import type { FinalResult } from '../../../types/game';

import StampPanel from './components/StampPanel';
import PlayerJoin from './components/PlayerJoin';
import PlayerLobby from './components/PlayerLobby';
import PlayerReceptionClosed from './components/PlayerReceptionClosed';
import PlayerIntro from './components/PlayerIntro';
import PlayerQuizWaiting from './components/PlayerQuizWaiting';
import PlayerQuizActive from './components/PlayerQuizActive';
import PlayerResultVotes from './components/PlayerResultVotes';
import PlayerFinalResult from './components/PlayerFinalResult';
import PlayerGameOver from './components/PlayerGameOver';

export default function PlayerApp() {
  return (
    <SocketProvider role="player">
      <PlayerAppContent />
    </SocketProvider>
  );
}

function PlayerAppContent() {
  const [searchParams] = useSearchParams();
  const { socket, setSocket, roomId, roomCode: savedRoomCode, playerName, playerId, setRoomId, setRoomCode, setPlayerName, setPlayerId, clearStorage } = useSocket();

  const [phase, setPhase] = useState<GamePhase | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [showReconnectDialog, setShowReconnectDialog] = useState(false);
  const [reconnectError, setReconnectError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [quizNumber, setQuizNumber] = useState(0);
  const [quizChoices, setQuizChoices] = useState<Array<{ text: string }>>([]);
  const [quizEndsAt, setQuizEndsAt] = useState(0);
  const [myAnswer, setMyAnswer] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | undefined>(undefined);
  const [, setPointsData] = useState<ResultPointsShowEvent | null>(null);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [winnerRevealed, setWinnerRevealed] = useState(false);
  const [_totalPlayers, setTotalPlayers] = useState(0);
  const [myTotalScore, setMyTotalScore] = useState<number | undefined>(undefined);
  const [myQuizEarnedPoints, setMyQuizEarnedPoints] = useState<number | undefined>(undefined);
  const prevTotalScoreRef = useRef<number>(0);

  const roomCodeFromUrl = searchParams.get('room');

  useEffect(() => {
    if (!socket && savedRoomCode && roomId && playerName && playerId) {
      setShowReconnectDialog(true);
    }
  }, [socket, savedRoomCode, roomId, playerName, playerId]);

  // 接続中はタブを閉じる・離脱しようとしたときに警告を表示
  useEffect(() => {
    if (!socket) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [socket]);

  const handleReconnect = () => {
    if (!savedRoomCode || !playerId || !playerName) return;
    setShowReconnectDialog(false);
    setReconnecting(true);
    const newSocket = createSocket();

    newSocket.on('stateSync', (data: StateSyncEvent) => {
      const rs = data.roomState;
      const ps = data.playerState;

      if (rs.currentQuiz) {
        const q = rs.currentQuiz;
        setQuizNumber(q.quizNumber);
        setQuizChoices(q.choices);
        if (rs.phase === GamePhase.QUIZ_ACTIVE) setQuizEndsAt(q.endsAt);
      }

      // 自分の回答・スコアを復元
      if (ps) {
        // スコアバー
        if (ps.totalScore > 0) {
          setMyTotalScore(ps.totalScore);
          prevTotalScoreRef.current = ps.totalScore;
        }

        // 現在のクイズへの回答
        if (rs.currentQuiz) {
          const qn = rs.currentQuiz.quizNumber;
          const answer = ps.answers.find(a => a.quizNumber === qn);
          if (answer) setMyAnswer(answer.choiceIndex);
        }
      }

      // RESULT フェーズ: 正解・獲得ポイントを復元
      const phase = rs.phase;
      if (phase === GamePhase.RESULT_SHOWING_ANSWER || phase === GamePhase.RESULT_SHOWING_VOTES) {
        const history = rs.quizHistory;
        const last = history[history.length - 1];
        if (last) {
          setCorrectIndex(last.correctIndex);
          if (ps) {
            const ans = ps.answers.find(a => a.quizNumber === last.quizNumber);
            if (ans) setMyQuizEarnedPoints(ans.earnedPoints);
          }
        }
      }
    });

    newSocket.on('connect', () => {
      newSocket.emit('reconnectPlayer', { roomCode: savedRoomCode, playerId, playerName }, (response: JoinRoomResponse | ErrorResponse) => {
        if ('code' in response) {
          newSocket.disconnect();
          setReconnecting(false);
          setReconnectError(response.message);
          setShowReconnectDialog(true);
        } else {
          setSocket(newSocket);
          setPhase(response.currentPhase);
          setReconnecting(false);
          setReconnectError(null);
        }
      });
    });

    newSocket.on('connect_error', () => {
      newSocket.disconnect();
      setReconnecting(false);
      setReconnectError('サーバーに接続できませんでした');
      setShowReconnectDialog(true);
    });
  };

  const handleCancelReconnect = () => { setShowReconnectDialog(false); clearStorage(); };

  useEffect(() => {
    if (!socket) return;

    const onPhaseChanged = (data: PhaseChangedEvent) => {
      setPhase(data.phase);
      if (data.phase === GamePhase.QUIZ_PREPARE || data.phase === GamePhase.QUIZ_SHOWING_QUESTION) {
        setMyAnswer(null);
        setCorrectIndex(undefined);
        setPointsData(null);
        setMyQuizEarnedPoints(undefined);
      }
    };
    const onQuizChoicesShow = (data: QuizChoicesShowEvent) => {
      setQuizNumber(data.quizNumber);
      setQuizChoices(data.choices);
    };
    const onAnswerReceived = (data: { choiceIndex: number; timeSpent: number }) => {
      setMyAnswer(data.choiceIndex);
    };
    const onQuizActive = (data: QuizActiveEvent) => {
      setQuizNumber(data.quiz.quizNumber);
      setQuizChoices(data.quiz.choices);
      setQuizEndsAt(data.endsAt);
      setTotalPlayers(0);
    };
    const onResultVotesShow = (data: ResultVotesShowEvent) => {
      setQuizNumber(data.quizNumber);
      if (playerId) {
        const entry = data.leaderboard.find(e => e.playerId === playerId);
        if (entry) {
          setMyQuizEarnedPoints(entry.totalScore - prevTotalScoreRef.current);
          setMyTotalScore(entry.totalScore);
          prevTotalScoreRef.current = entry.totalScore;
        }
      }
    };
    const onResultAnswerShow = (data: ResultAnswerShowEvent) => {
      setCorrectIndex(data.correctIndex);
      setQuizNumber(data.quizNumber);
    };
    const onResultPointsShow = (data: ResultPointsShowEvent) => {
      setPointsData(data);
    };
    const onFinalResult = (data: FinalResultEvent) => setFinalResult(data.finalResult);
    const onWinnerRevealed = () => setWinnerRevealed(true);
    const onGameReset = () => {
      prevTotalScoreRef.current = 0;
      setMyTotalScore(undefined);
      setMyQuizEarnedPoints(undefined);
      setWinnerRevealed(false);
      setFinalResult(null);
    };

    socket.on('phaseChanged', onPhaseChanged);
    socket.on('answerReceived', onAnswerReceived);
    socket.on('quizChoicesShow', onQuizChoicesShow);
    socket.on('quizActive', onQuizActive);
    socket.on('resultVotesShow', onResultVotesShow);
    socket.on('resultAnswerShow', onResultAnswerShow);
    socket.on('resultPointsShow', onResultPointsShow);
    socket.on('finalResult', onFinalResult);
    socket.on('winnerRevealed', onWinnerRevealed);
    socket.on('gameReset', onGameReset);

    return () => {
      socket.off('phaseChanged', onPhaseChanged);
      socket.off('answerReceived', onAnswerReceived);
      socket.off('quizChoicesShow', onQuizChoicesShow);
      socket.off('quizActive', onQuizActive);
      socket.off('resultVotesShow', onResultVotesShow);
      socket.off('resultAnswerShow', onResultAnswerShow);
      socket.off('resultPointsShow', onResultPointsShow);
      socket.off('finalResult', onFinalResult);
      socket.off('winnerRevealed', onWinnerRevealed);
      socket.off('gameReset', onGameReset);
    };
  }, [socket]);

  const handleJoinRoom = (roomCode: string, playerName: string) => {
    const newSocket = createSocket();
    newSocket.on('connect', () => {
      const request: JoinRoomRequest = { roomCode: roomCode.toUpperCase(), playerName: playerName.trim() };
      newSocket.emit('joinRoom', request, (response: JoinRoomResponse | ErrorResponse) => {
        if ('code' in response) {
          setError(response.message);
          newSocket.disconnect();
        } else {
          setRoomId(response.roomId);
          setRoomCode(response.roomCode);
          setPlayerName(response.playerName);
          setPlayerId(response.playerId);
          setSocket(newSocket);
          setPhase(response.currentPhase);
          setError(null);
        }
      });
    });
    newSocket.on('connect_error', () => setError('サーバーに接続できませんでした'));
  };

  if (showReconnectDialog) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          {reconnectError ? (
            <>
              <h2 style={styles.dialogTitle}>⚠️ 再接続に失敗しました</h2>
              <p style={styles.dialogText}>ルーム <strong>{savedRoomCode}</strong> への再接続に失敗しました。<br /><span style={styles.errorText}>理由: {reconnectError}</span></p>
              <div style={styles.dialogButtons}>
                <button style={styles.reconnectButton} onClick={handleReconnect}>再接続を試す</button>
                <button style={styles.cancelButton} onClick={handleCancelReconnect}>新規参加</button>
              </div>
            </>
          ) : (
            <>
              <h2 style={styles.dialogTitle}>再接続しますか？</h2>
              <p style={styles.dialogText}>前回のセッションが見つかりました。<br />ルーム <strong>{savedRoomCode}</strong> に再接続しますか？</p>
              <div style={styles.dialogButtons}>
                <button style={styles.reconnectButton} onClick={handleReconnect}>再接続する</button>
                <button style={styles.cancelButton} onClick={handleCancelReconnect}>新規参加</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (reconnecting) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', paddingTop: spacing['8'] }}>
            <div style={styles.spinner} />
            <p style={{ color: '#94a3b8' }}>ルームに再接続中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!roomId || !phase) {
    return <PlayerJoin onJoinRoom={handleJoinRoom} error={error} roomCodeFromUrl={roomCodeFromUrl} />;
  }

  const IN_GAME_PHASES = new Set([
    GamePhase.GAME_INTRO,
    GamePhase.QUIZ_PREPARE,
    GamePhase.QUIZ_SHOWING_QUESTION,
    GamePhase.QUIZ_SHOWING_IMAGE,
    GamePhase.QUIZ_SHOWING_CHOICES,
    GamePhase.QUIZ_ACTIVE,
    GamePhase.QUIZ_CLOSED,
    GamePhase.RESULT_SHOWING_ANNOUNCE,
    GamePhase.RESULT_SHOWING_ANSWER,
    GamePhase.RESULT_SHOWING_VOTES,
    GamePhase.RESULT_SHOWING_POINTS,
    GamePhase.INTERIM_LEADERBOARD,
    GamePhase.FINAL_RESULT,
    GamePhase.GAME_OVER,
  ]);
  const showStatusBar = IN_GAME_PHASES.has(phase);

  let content: React.ReactNode;
  switch (phase) {
    case GamePhase.LOBBY:
      content = <PlayerLobby />;
      break;
    case GamePhase.RECEPTION_CLOSED:
      content = <PlayerReceptionClosed />;
      break;
    case GamePhase.GAME_INTRO:
      content = <PlayerIntro />;
      break;
    case GamePhase.QUIZ_PREPARE:
      content = <PlayerQuizWaiting />;
      break;
    case GamePhase.QUIZ_SHOWING_QUESTION:
    case GamePhase.QUIZ_SHOWING_IMAGE:
      content = <PlayerQuizWaiting lookAtScreen />;
      break;
    case GamePhase.QUIZ_SHOWING_CHOICES:
      content = <PlayerQuizWaiting message="もうすぐ回答が始まります..." />;
      break;
    case GamePhase.QUIZ_ACTIVE:
      content = (
        <PlayerQuizActive
          quizNumber={quizNumber}
          choices={quizChoices}
          endsAt={quizEndsAt}
        />
      );
      break;
    case GamePhase.QUIZ_CLOSED:
      content = (
        <PlayerQuizActive
          quizNumber={quizNumber}
          choices={quizChoices}
          endsAt={quizEndsAt}
          closed
        />
      );
      break;
    case GamePhase.RESULT_SHOWING_ANNOUNCE:
    case GamePhase.RESULT_SHOWING_ANSWER:
      content = <PlayerQuizWaiting lookAtScreen />;
      break;
    case GamePhase.RESULT_SHOWING_VOTES:
      content = (
        <PlayerResultVotes
          quizNumber={quizNumber}
          myAnswer={myAnswer}
          correctIndex={correctIndex}
          quizEarnedPoints={myQuizEarnedPoints}
          totalScore={myTotalScore}
        />
      );
      break;
    case GamePhase.RESULT_SHOWING_POINTS:
    case GamePhase.INTERIM_LEADERBOARD:
      content = <PlayerQuizWaiting lookAtScreen />;
      break;
    case GamePhase.FINAL_RESULT:
      content = (winnerRevealed && finalResult && playerId)
        ? <PlayerFinalResult finalResult={finalResult} myPlayerId={playerId} />
        : <PlayerQuizWaiting lookAtScreen />;
      break;
    case GamePhase.GAME_OVER:
      content = <PlayerGameOver />;
      break;
    default:
      content = <div style={styles.container}><div style={styles.card}><p style={{ color: '#94a3b8' }}>不明なフェーズ: {phase}</p></div></div>;
  }

  return (
    <>
      {content}
      {socket && (
        <StampPanel socket={socket} showAboveStatusBar={showStatusBar} />
      )}
      {showStatusBar && (
        <div style={styles.statusBar}>
          <span style={styles.statusName}>{playerName}</span>
          <span style={styles.statusScore}>{myTotalScore ?? 0} <span style={styles.statusUnit}>pt</span></span>
        </div>
      )}
    </>
  );
}

const styles = {
  container: ui.pageCenter,
  card: ui.card,
  statusBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing['2']} ${spacing['5']}`,
    background: `rgba(26,11,46,0.88)`,
    backdropFilter: 'blur(8px)',
    borderTop: `2px solid ${colors.border}`,
    zIndex: 100,
  } as React.CSSProperties,
  statusName: {
    fontSize: fontSize.base,
    fontWeight: 700,
    color: colors.textBody,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '55%',
  } as React.CSSProperties,
  statusScore: {
    fontSize: fontSize['2xl'],
    fontWeight: 800,
    color: colors.amber,
    letterSpacing: '0.02em',
  } as React.CSSProperties,
  statusUnit: {
    fontSize: fontSize.sm,
    fontWeight: 600,
    color: colors.amberLight,
  } as React.CSSProperties,
  dialogTitle: { fontSize: fontSize['2xl'], fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing['4'], textAlign: 'center' as const },
  dialogText: { fontSize: fontSize.base, color: colors.textDim, marginBottom: spacing['6'], textAlign: 'center' as const, lineHeight: '1.6' },
  errorText: { display: 'block', color: colors.redLight, fontSize: fontSize.sm, marginTop: spacing['2'] } as React.CSSProperties,
  dialogButtons: { display: 'flex', gap: spacing['3'] } as React.CSSProperties,
  reconnectButton: { ...ui.buttonBlue, flex: 1, padding: '14px', fontSize: fontSize.base } as React.CSSProperties,
  cancelButton: { ...ui.buttonNeutral, flex: 1, padding: '14px', fontSize: fontSize.base } as React.CSSProperties,
  spinner: ui.spinner,
};
