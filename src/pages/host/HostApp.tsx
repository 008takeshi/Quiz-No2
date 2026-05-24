import { useState, useEffect, useRef } from 'react';
import { colors, ui, spacing, fontSize, radius } from '../../styles/theme';
import { SocketProvider, useSocket } from '../../contexts/SocketContext';
import { createSocket } from '../../lib/socket';
import { GamePhase } from '../../../types/game';
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  ErrorResponse,
  JoinRoomResponse,
  PhaseChangedEvent,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  StateSyncEvent,
  TemplateSelectedEvent,
  QuizQuestionShowEvent,
  QuizChoicesShowEvent,
  ResultVotesShowEvent,
  ResultAnswerShowEvent,
  AnswerCountEvent,
  FinalResultEvent,
  InterimLeaderboardShowEvent,
} from '../../../types/events';
import type { Player, ChoiceStatistics, LeaderboardEntry, FinalResult } from '../../../types/game';
import { reconstructFinalResult, reconstructInterimLeaderboard } from '../../lib/gameUtils';

import HostSetup from './components/HostSetup';
import HostLobby from './components/HostLobby';
import HostReceptionClosed from './components/HostReceptionClosed';
import HostIntro from './components/HostIntro';
import HostOptionsMenu from './components/HostOptionsMenu';
import HostQuizPrepare from './components/HostQuizPrepare';
import HostQuizShowing from './components/HostQuizShowing';
import HostQuizActive from './components/HostQuizActive';
import HostQuizClosed from './components/HostQuizClosed';
import HostResultVotes from './components/HostResultVotes';
import HostResultPoints from './components/HostResultPoints';
import HostInterimLeaderboard from './components/HostInterimLeaderboard';
import HostFinalResult from './components/HostFinalResult';

export default function HostApp() {
  return (
    <SocketProvider role="host">
      <HostAppContent />
    </SocketProvider>
  );
}

interface QuizDisplayState {
  quizNumber: number;
  question: string;
  questionImage?: string;
  choices: Array<{ text: string; image?: string }>;
  endsAt: number;
}

function HostAppContent() {
  const { socket, setSocket, roomId, roomCode, playerName, setRoomId, setRoomCode, setPlayerName, setPlayerId, clearStorage } = useSocket();

  const [phase, setPhase] = useState<GamePhase | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [totalQuizCount, setTotalQuizCount] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const floatingOptionsButtonRef = useRef<HTMLButtonElement>(null);

  // Quiz state
  const [quizDisplay, setQuizDisplay] = useState<QuizDisplayState | null>(null);
  const [answerCount, setAnswerCount] = useState(0);
  const [answerTotalPlayers, setAnswerTotalPlayers] = useState(0);
  const [resultStats, setResultStats] = useState<ChoiceStatistics[] | null>(null);
  const [resultQuestion, setResultQuestion] = useState('');
  const [resultQuizNumber, setResultQuizNumber] = useState(0);
  const [resultExplanation, setResultExplanation] = useState<string | undefined>(undefined);
  const [_leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [currentQuizNumber, setCurrentQuizNumber] = useState(0);
  const [interimLeaderboard, setInterimLeaderboard] = useState<InterimLeaderboardShowEvent | null>(null);

  // Reconnect on reload
  useEffect(() => {
    if (socket || !roomCode || !roomId || !playerName) return;
    setReconnecting(true);
    const newSocket = createSocket();
    let claimed = false;

    newSocket.on('connect', () => {
      newSocket.once('stateSync', (data: StateSyncEvent) => {
        const rs = data.roomState;
        setPlayers(Object.values(rs.players));
        setPhase(rs.phase);
        setTotalQuizCount(rs.settings.totalQuizCount ?? 0);
        const history = rs.quizHistory;
        setCurrentQuizNumber(history.length);
        if (history.length > 0) {
          const last = history[history.length - 1];
          setResultStats(last.statistics);
          setResultQuestion(last.question);
          setResultQuizNumber(last.quizNumber);
          setLeaderboard(last.leaderboard);
        }
        if (rs.currentQuiz) {
          const q = rs.currentQuiz;
          const endsAt = rs.phase === GamePhase.QUIZ_ACTIVE ? q.endsAt : 0;
          setQuizDisplay({ quizNumber: q.quizNumber, question: q.question, questionImage: q.questionImage, choices: q.choices, endsAt });

          // QUIZ_ACTIVE: 回答済み人数を復元
          if (rs.phase === GamePhase.QUIZ_ACTIVE) {
            const allPlayers = Object.values(rs.players);
            const count = allPlayers.filter(p => p.answers.some(a => a.quizNumber === q.quizNumber)).length;
            setAnswerCount(count);
            setAnswerTotalPlayers(allPlayers.length);
          }
          if (rs.phase === GamePhase.RESULT_SHOWING_ANSWER || rs.phase === GamePhase.RESULT_SHOWING_VOTES) {
            setResultExplanation(q.explanation);
          }
        }
        // FINAL_RESULT: 最終結果を再構築
        if (rs.phase === GamePhase.FINAL_RESULT || rs.phase === GamePhase.GAME_OVER) {
          setFinalResult(reconstructFinalResult(rs));
        }
        // INTERIM_LEADERBOARD: 途中経過を再構築
        if (rs.phase === GamePhase.INTERIM_LEADERBOARD) {
          setInterimLeaderboard(reconstructInterimLeaderboard(rs));
        }
      });

      newSocket.emit('reconnectHost', { roomCode, playerName }, (response: JoinRoomResponse | ErrorResponse) => {
        if ('code' in response) {
          alert(`再接続失敗: ${response.message}`);
          newSocket.disconnect();
          clearStorage();
          setPhase(null);
          setReconnecting(false);
        } else {
          claimed = true;
          setSocket(newSocket);
          setReconnecting(false);
        }
      });
    });

    newSocket.on('connect_error', () => {
      alert('サーバーに接続できませんでした');
      clearStorage();
      setPhase(null);
      setReconnecting(false);
    });

    return () => { if (!claimed) newSocket.disconnect(); };
  }, [socket, roomCode, roomId, playerName, setSocket, clearStorage]);

  // Event listeners
  useEffect(() => {
    if (!socket) return;

    const onPhaseChanged = (data: PhaseChangedEvent) => {
      setPhase(data.phase);
      if (data.phase === GamePhase.QUIZ_PREPARE) {
        setAnswerCount(0);
        setAnswerTotalPlayers(0);
      }
    };
    const onStateSync = (data: StateSyncEvent) => {
      setPlayers(Object.values(data.roomState.players));
      setPhase(data.roomState.phase);
      setTotalQuizCount(data.roomState.settings.totalQuizCount ?? 0);
      const history = data.roomState.quizHistory;
      setCurrentQuizNumber(history.length);
    };
    const onPlayerJoined = (data: PlayerJoinedEvent) => {
      setPlayers(prev => {
        const exists = prev.some(p => p.id === data.player.id);
        return exists ? prev.map(p => p.id === data.player.id ? data.player : p) : [...prev, data.player];
      });
    };
    const onPlayerLeft = (data: PlayerLeftEvent) => setPlayers(prev => prev.filter(p => p.id !== data.playerId));
    const onTemplateSelected = (data: TemplateSelectedEvent) => setTotalQuizCount(data.totalQuizCount);

    const onQuizQuestionShow = (data: QuizQuestionShowEvent) => {
      setQuizDisplay(prev => ({
        quizNumber: data.quizNumber,
        question: data.question,
        questionImage: undefined,
        choices: prev?.choices ?? [],
        endsAt: 0,
      }));
      setCurrentQuizNumber(data.quizNumber);
    };
    const onQuizChoicesShow = (data: QuizChoicesShowEvent) => {
      setQuizDisplay(prev => prev ? { ...prev, choices: data.choices } : prev);
    };
    const onQuizActive = (data: import('../../../types/events').QuizActiveEvent) => {
      setQuizDisplay(prev => prev ? { ...prev, endsAt: data.endsAt } : {
        quizNumber: data.quiz.quizNumber, question: data.quiz.question,
        questionImage: data.quiz.questionImage, choices: data.quiz.choices, endsAt: data.endsAt,
      });
      setAnswerCount(0);
      setAnswerTotalPlayers(players.length);
    };
    const onAnswerCount = (data: AnswerCountEvent) => {
      setAnswerCount(data.answerCount);
      setAnswerTotalPlayers(data.totalPlayers);
    };
    const onResultVotesShow = (data: ResultVotesShowEvent) => {
      setResultStats(data.statistics);
      setResultQuizNumber(data.quizNumber);
      setLeaderboard(data.leaderboard);
    };
    const onResultAnswerShow = (data: ResultAnswerShowEvent) => {
      setResultStats(data.statistics);
      setResultQuizNumber(data.quizNumber);
      if (quizDisplay) setResultQuestion(quizDisplay.question);
      setResultExplanation(data.explanation);
    };
    const onQuizClosed = () => {};
    const onFinalResult = (data: FinalResultEvent) => setFinalResult(data.finalResult);
    const onInterimLeaderboardShow = (data: InterimLeaderboardShowEvent) => setInterimLeaderboard(data);

    socket.on('phaseChanged', onPhaseChanged);
    socket.on('stateSync', onStateSync);
    socket.on('playerJoined', onPlayerJoined);
    socket.on('playerLeft', onPlayerLeft);
    socket.on('templateSelected', onTemplateSelected);
    socket.on('quizQuestionShow', onQuizQuestionShow);
    socket.on('quizChoicesShow', onQuizChoicesShow);
    socket.on('quizActive', onQuizActive);
    socket.on('answerCount', onAnswerCount);
    socket.on('resultVotesShow', onResultVotesShow);
    socket.on('resultAnswerShow', onResultAnswerShow);
    socket.on('quizClosed', onQuizClosed);
    socket.on('finalResult', onFinalResult);
    socket.on('interimLeaderboardShow', onInterimLeaderboardShow);

    return () => {
      socket.off('phaseChanged', onPhaseChanged);
      socket.off('stateSync', onStateSync);
      socket.off('playerJoined', onPlayerJoined);
      socket.off('playerLeft', onPlayerLeft);
      socket.off('templateSelected', onTemplateSelected);
      socket.off('quizQuestionShow', onQuizQuestionShow);
      socket.off('quizChoicesShow', onQuizChoicesShow);
      socket.off('quizActive', onQuizActive);
      socket.off('answerCount', onAnswerCount);
      socket.off('resultVotesShow', onResultVotesShow);
      socket.off('resultAnswerShow', onResultAnswerShow);
      socket.off('quizClosed', onQuizClosed);
      socket.off('finalResult', onFinalResult);
      socket.off('interimLeaderboardShow', onInterimLeaderboardShow);
    };
  }, [socket, players.length, quizDisplay]);

  const handleCreateRoom = (maxPlayers: number, defaultTimeLimit: number, template: import('../../../types/events').SelectTemplateRequest) => {
    const newSocket = createSocket();
    newSocket.on('connect', () => {
      const request: CreateRoomRequest = {
        template,
        settings: { maxPlayers, defaultTimeLimit, allowLateJoin: false },
      };
      newSocket.emit('createRoom', request, (response: CreateRoomResponse | ErrorResponse) => {
        if ('code' in response) {
          setError(response.message);
          newSocket.disconnect();
        } else {
          setRoomId(response.roomId);
          setRoomCode(response.roomCode);
          setPlayerName(response.settings.hostName);
          setPlayerId(response.hostId);
          setSocket(newSocket);
          setPhase(GamePhase.LOBBY);
          setTotalQuizCount(response.settings.totalQuizCount ?? 0);
          setError(null);
        }
      });
    });
    newSocket.on('connect_error', () => setError('サーバーに接続できませんでした'));
  };

  if (reconnecting || (roomId && !socket)) {
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

  if (!roomId || !phase) return <HostSetup onCreateRoom={handleCreateRoom} error={error} />;

  const wrap = (content: React.ReactNode) => (
    <>
      {content}
      {showOptions && <HostOptionsMenu onClose={() => setShowOptions(false)} buttonRef={floatingOptionsButtonRef} roomCode={roomCode ?? undefined} />}
      <button ref={floatingOptionsButtonRef} style={styles.floatingBtn} onClick={() => setShowOptions(true)} title="オプション">⚙️</button>
    </>
  );

  const hasMoreQuizzes = currentQuizNumber < totalQuizCount;

  switch (phase) {
    case GamePhase.LOBBY:
      return wrap(<HostLobby players={players} />);
    case GamePhase.RECEPTION_CLOSED:
      return wrap(<HostReceptionClosed />);
    case GamePhase.GAME_INTRO:
      return wrap(<HostIntro playerCount={players.length} totalQuizCount={totalQuizCount} />);
    case GamePhase.QUIZ_PREPARE:
      return wrap(<HostQuizPrepare quizNumber={currentQuizNumber + 1} totalQuizCount={totalQuizCount} />);
    case GamePhase.QUIZ_SHOWING_QUESTION:
    case GamePhase.QUIZ_SHOWING_IMAGE:
    case GamePhase.QUIZ_SHOWING_CHOICES:
      return wrap(
        <HostQuizShowing
          phase={phase}
          quizNumber={quizDisplay?.quizNumber ?? currentQuizNumber}
          totalQuizCount={totalQuizCount}
          question={quizDisplay?.question ?? ''}
          questionImage={quizDisplay?.questionImage}
          choices={quizDisplay?.choices ?? []}
        />
      );
    case GamePhase.QUIZ_ACTIVE:
      return wrap(
        <HostQuizActive
          quizNumber={quizDisplay?.quizNumber ?? currentQuizNumber}
          totalQuizCount={totalQuizCount}
          question={quizDisplay?.question ?? ''}
          choices={quizDisplay?.choices ?? []}
          endsAt={quizDisplay?.endsAt || Date.now() + 30000}
          answerCount={answerCount}
          totalPlayers={answerTotalPlayers}
        />
      );
    case GamePhase.QUIZ_CLOSED:
      return wrap(<HostQuizClosed />);
    case GamePhase.RESULT_SHOWING_ANNOUNCE:
      return wrap(
        <HostResultVotes
          quizNumber={quizDisplay?.quizNumber ?? currentQuizNumber}
          question={quizDisplay?.question ?? ''}
          statistics={[]}
          phase="announce"
          hasMoreQuizzes={hasMoreQuizzes}
        />
      );
    case GamePhase.RESULT_SHOWING_ANSWER:
      return wrap(
        <HostResultVotes
          quizNumber={resultQuizNumber}
          question={resultQuestion}
          statistics={resultStats ?? []}
          phase="answer"
          hasMoreQuizzes={hasMoreQuizzes}
          explanation={resultExplanation}
        />
      );
    case GamePhase.RESULT_SHOWING_VOTES: {
      const isHalfwayPoint = totalQuizCount >= 2 && currentQuizNumber === Math.floor(totalQuizCount / 2);
      return wrap(
        <HostResultVotes
          quizNumber={resultQuizNumber}
          question={resultQuestion}
          statistics={resultStats ?? []}
          phase="votes"
          hasMoreQuizzes={hasMoreQuizzes}
          isHalfwayPoint={isHalfwayPoint}
          explanation={resultExplanation}
        />
      );
    }
    case GamePhase.RESULT_SHOWING_POINTS:
      return wrap(<HostResultPoints hasMoreQuizzes={hasMoreQuizzes} />);
    case GamePhase.INTERIM_LEADERBOARD:
      return wrap(
        <HostInterimLeaderboard
          completedQuizCount={interimLeaderboard?.completedQuizCount ?? currentQuizNumber}
          totalQuizCount={totalQuizCount}
          topEntries={interimLeaderboard?.topEntries ?? []}
        />
      );
    case GamePhase.FINAL_RESULT:
      return wrap(finalResult ? <HostFinalResult finalResult={finalResult} /> : <div style={styles.container}><div style={styles.card}><p style={{ color: '#94a3b8', textAlign: 'center' }}>最終結果を読み込み中...</p></div></div>);
    case GamePhase.GAME_OVER:
      return wrap(
        <div style={styles.container}>
          <div style={styles.card}>
            <p style={{ fontSize: fontSize['2xl'], color: '#94a3b8', textAlign: 'center' }}>ゲームが終了しました。ありがとうございました！</p>
          </div>
        </div>
      );
    default:
      return wrap(<div style={styles.container}><div style={styles.card}><p style={{ color: '#94a3b8' }}>不明なフェーズ: {phase}</p></div></div>);
  }
}

const styles = {
  container: ui.pageCenter,
  card: ui.card,
  spinner: ui.spinner,
  floatingBtn: { position: 'fixed' as const, top: spacing['5'], right: spacing['5'], width: spacing['12'], height: spacing['12'], borderRadius: radius.circle, background: colors.border, border: 'none', fontSize: fontSize['2xl'], cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 100 } as React.CSSProperties,
};
