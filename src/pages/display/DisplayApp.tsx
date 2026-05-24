import { useState, useEffect, useRef } from 'react';
import { colors, ui, displayPage, spacing, fontSize } from '../../styles/theme';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketProvider, useSocket } from '../../contexts/SocketContext';
import { createSocket } from '../../lib/socket';
import { GamePhase } from '../../../types/game';
import type {
  JoinAsDisplayRequest,
  JoinAsDisplayResponse,
  ErrorResponse,
  PhaseChangedEvent,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  StateSyncEvent,
  QuizQuestionShowEvent,
  QuizImageShowEvent,
  QuizChoicesShowEvent,
  QuizActiveEvent,
  ResultVotesShowEvent,
  ResultAnswerShowEvent,
  FinalResultEvent,
  InterimLeaderboardShowEvent,
  StampBroadcastEvent,
} from '../../../types/events';
import type { Player, ChoiceStatistics, LeaderboardEntry, FinalResult } from '../../../types/game';
import { reconstructFinalResult, reconstructInterimLeaderboard } from '../../lib/gameUtils';

import StampOverlay, { type ActiveStamp, getStampX, getStampY, STAMP_DISPLAY_DURATION_MS } from './components/StampOverlay';
import DisplayLobby from './components/DisplayLobby';
import DisplayReceptionClosed from './components/DisplayReceptionClosed';
import DisplayIntro from './components/DisplayIntro';
import DisplayQuizPrepare from './components/DisplayQuizPrepare';
import DisplayQuizShowing from './components/DisplayQuizShowing';
import DisplayQuizActive from './components/DisplayQuizActive';
import DisplayResultVotes from './components/DisplayResultVotes';
import DisplayResultPoints from './components/DisplayResultPoints';
import DisplayInterimLeaderboard from './components/DisplayInterimLeaderboard';
import DisplayFinalResult from './components/DisplayFinalResult';
import DisplayGameOver from './components/DisplayGameOver';

export default function DisplayApp() {
  return (
    <SocketProvider role="display">
      <DisplayAppContent />
    </SocketProvider>
  );
}

interface QuizDisplayState {
  quizNumber: number;
  question: string;
  questionImage?: string;
  choices: Array<{ text: string }>;
  endsAt: number;
}

function DisplayAppContent() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { socket, setSocket, roomId, setRoomId, setRoomCode, clearStorage } = useSocket();

  const [phase, setPhase] = useState<GamePhase | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [totalQuizCount, setTotalQuizCount] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuizNumber, setCurrentQuizNumber] = useState(0);

  // Quiz display state
  const [quizDisplay, setQuizDisplay] = useState<QuizDisplayState | null>(null);
  const [resultStats, setResultStats] = useState<ChoiceStatistics[] | null>(null);
  const [resultQuestion, setResultQuestion] = useState('');
  const [resultQuizNumber, setResultQuizNumber] = useState(0);
  const [resultExplanation, setResultExplanation] = useState<string | undefined>(undefined);
  const [_leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [winnerRevealed, setWinnerRevealed] = useState(false);
  const [finalResultSkipAnimation, setFinalResultSkipAnimation] = useState(false);
  const [interimLeaderboard, setInterimLeaderboard] = useState<InterimLeaderboardShowEvent | null>(null);
  const [activeStamps, setActiveStamps] = useState<ActiveStamp[]>([]);
  const stampLaneRef = useRef(0);

  useEffect(() => {
    if (socket || !roomCode) return;
    let claimed = false;
    const newSocket = createSocket();

    newSocket.on('stateSync', (data: StateSyncEvent) => {
      setPlayers(Object.values(data.roomState.players));
      setPhase(data.roomState.phase);
      setTotalQuizCount(data.roomState.settings.totalQuizCount ?? 0);
      const history = data.roomState.quizHistory;
      setCurrentQuizNumber(history.length);
      if (history.length > 0) {
        const last = history[history.length - 1];
        setResultStats(last.statistics);
        setResultQuestion(last.question);
        setResultQuizNumber(last.quizNumber);
        setLeaderboard(last.leaderboard);
      }
      if (data.roomState.currentQuiz) {
        const q = data.roomState.currentQuiz;
        const endsAt = data.roomState.phase === GamePhase.QUIZ_ACTIVE ? q.endsAt : 0;
        setQuizDisplay({ quizNumber: q.quizNumber, question: q.question, questionImage: q.questionImage, choices: q.choices, endsAt });
        if (data.roomState.phase === GamePhase.RESULT_SHOWING_ANSWER || data.roomState.phase === GamePhase.RESULT_SHOWING_VOTES) {
          setResultExplanation(q.explanation);
        }
      }
      if (data.roomState.phase === GamePhase.FINAL_RESULT || data.roomState.phase === GamePhase.GAME_OVER) {
        setFinalResult(reconstructFinalResult(data.roomState));
        setWinnerRevealed(data.roomState.winnerRevealed);
        setFinalResultSkipAnimation(true);
      }
      if (data.roomState.phase === GamePhase.INTERIM_LEADERBOARD) {
        setInterimLeaderboard(reconstructInterimLeaderboard(data.roomState));
      }
    });

    newSocket.on('phaseChanged', (data: PhaseChangedEvent) => {
      setPhase(data.phase);
    });

    newSocket.on('playerJoined', (data: PlayerJoinedEvent) => {
      setPlayers(prev => {
        const exists = prev.some(p => p.id === data.player.id);
        return exists ? prev.map(p => p.id === data.player.id ? data.player : p) : [...prev, data.player];
      });
    });

    newSocket.on('playerLeft', (data: PlayerLeftEvent) => {
      setPlayers(prev => prev.filter(p => p.id !== data.playerId));
    });

    newSocket.on('quizQuestionShow', (data: QuizQuestionShowEvent) => {
      setQuizDisplay({ quizNumber: data.quizNumber, question: data.question, questionImage: undefined, choices: [], endsAt: 0 });
      setCurrentQuizNumber(data.quizNumber);
    });

    newSocket.on('quizImageShow', (data: QuizImageShowEvent) => {
      setQuizDisplay(prev => prev ? { ...prev, questionImage: data.questionImage } : prev);
    });

    newSocket.on('quizChoicesShow', (data: QuizChoicesShowEvent) => {
      setQuizDisplay(prev => prev ? { ...prev, choices: data.choices } : prev);
    });

    newSocket.on('quizActive', (data: QuizActiveEvent) => {
      setQuizDisplay(prev => prev ? { ...prev, endsAt: data.endsAt } : {
        quizNumber: data.quiz.quizNumber, question: data.quiz.question,
        questionImage: data.quiz.questionImage, choices: data.quiz.choices, endsAt: data.endsAt,
      });
    });

    newSocket.on('resultVotesShow', (data: ResultVotesShowEvent) => {
      setResultStats(data.statistics);
      setResultQuizNumber(data.quizNumber);
      setLeaderboard(data.leaderboard);
      setResultQuestion(prev => quizDisplay?.question ?? prev);
    });

    newSocket.on('resultAnswerShow', (data: ResultAnswerShowEvent) => {
      setResultStats(data.statistics);
      setResultQuizNumber(data.quizNumber);
      setResultExplanation(data.explanation);
    });

    newSocket.on('finalResult', (data: FinalResultEvent) => {
      setFinalResult(data.finalResult);
      setWinnerRevealed(false);
      setFinalResultSkipAnimation(false);
      setLeaderboard(data.finalResult.leaderboard);
    });

    newSocket.on('winnerRevealed', () => {
      setWinnerRevealed(true);
    });

    newSocket.on('interimLeaderboardShow', (data: InterimLeaderboardShowEvent) => {
      setInterimLeaderboard(data);
    });

    const onStampBroadcast = (data: StampBroadcastEvent) => {
      const stamp: ActiveStamp = {
        id: `${data.playerId}-${Date.now()}-${Math.random()}`,
        stampId: data.stampId,
        playerName: data.playerName,
        x: getStampX(stampLaneRef.current++),
        y: getStampY(),
      };
      setActiveStamps(prev => [...prev, stamp]);
      setTimeout(() => {
        setActiveStamps(prev => prev.filter(s => s.id !== stamp.id));
      }, STAMP_DISPLAY_DURATION_MS);
    };
    newSocket.on('stampBroadcast', onStampBroadcast);

    newSocket.on('roomDeleted', () => {
      setError('ルームが削除されました');
      clearStorage();
      setTimeout(() => navigate('/display/error?message=' + encodeURIComponent('ルームが削除されました')), 3000);
    });

    const joinRoom = () => {
      const request: JoinAsDisplayRequest = { roomCode: roomCode.toUpperCase() };
      newSocket.emit('joinAsDisplay', request, (response: JoinAsDisplayResponse | ErrorResponse) => {
        if ('code' in response) {
          setError(response.message);
          setReconnecting(false);
        } else {
          claimed = true;
          setRoomId(response.roomId);
          setRoomCode(response.roomCode);
          setSocket(newSocket);
          setReconnecting(false);
        }
      });
    };

    newSocket.on('connect', joinRoom);
    newSocket.on('disconnect', reason => {
      if (reason !== 'io server disconnect' && reason !== 'io client disconnect') setReconnecting(true);
    });
    newSocket.on('connect_error', () => setError('サーバーに接続できませんでした'));

    return () => {
      if (!claimed) {
        newSocket.off('stampBroadcast', onStampBroadcast);
        newSocket.disconnect();
      }
    };
  }, [roomCode, socket, setRoomId, setRoomCode, setSocket, navigate, clearStorage, quizDisplay?.question]);

  if (error) {
    return (
      <div style={styles.center}>
        <div style={{ ...styles.card, border: '2px solid #ef4444' }}>
          <h2 style={{ color: '#ef4444', fontSize: fontSize['3xl'], textAlign: 'center', marginBottom: spacing['4'] }}>接続エラー</h2>
          <p style={{ color: '#fca5a5', fontSize: fontSize.lg, textAlign: 'center' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (reconnecting || !roomId || !phase) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>{reconnecting ? 'サーバーに再接続中...' : 'ルームに接続中...'}</p>
        </div>
      </div>
    );
  }

  let phaseContent: React.ReactNode;
  switch (phase) {
    case GamePhase.LOBBY:
      phaseContent = <DisplayLobby players={players} />;
      break;
    case GamePhase.RECEPTION_CLOSED:
      phaseContent = <DisplayReceptionClosed />;
      break;
    case GamePhase.GAME_INTRO:
      phaseContent = <DisplayIntro playerCount={players.length} totalQuizCount={totalQuizCount} />;
      break;
    case GamePhase.QUIZ_PREPARE:
      phaseContent = <DisplayQuizPrepare quizNumber={currentQuizNumber + 1} totalQuizCount={totalQuizCount} />;
      break;
    case GamePhase.QUIZ_SHOWING_QUESTION:
    case GamePhase.QUIZ_SHOWING_IMAGE:
    case GamePhase.QUIZ_SHOWING_CHOICES:
      phaseContent = (
        <DisplayQuizShowing
          phase={phase}
          quizNumber={quizDisplay?.quizNumber ?? currentQuizNumber}
          totalQuizCount={totalQuizCount}
          question={quizDisplay?.question ?? ''}
          questionImage={quizDisplay?.questionImage}
          choices={quizDisplay?.choices ?? []}
        />
      );
      break;
    case GamePhase.QUIZ_ACTIVE:
      phaseContent = (
        <DisplayQuizActive
          quizNumber={quizDisplay?.quizNumber ?? currentQuizNumber}
          totalQuizCount={totalQuizCount}
          question={quizDisplay?.question ?? ''}
          choices={quizDisplay?.choices ?? []}
          endsAt={quizDisplay?.endsAt || Date.now() + 30000}
        />
      );
      break;
    case GamePhase.QUIZ_CLOSED:
      phaseContent = (
        <DisplayQuizActive
          quizNumber={quizDisplay?.quizNumber ?? currentQuizNumber}
          totalQuizCount={totalQuizCount}
          question={quizDisplay?.question ?? ''}
          choices={quizDisplay?.choices ?? []}
          endsAt={quizDisplay?.endsAt ?? Date.now()}
          closed
        />
      );
      break;
    case GamePhase.RESULT_SHOWING_ANNOUNCE: {
      const announceStats = (quizDisplay?.choices ?? []).map((c, i) => ({
        choiceIndex: i, text: c.text, voteCount: 0, percentage: 0, rank: 0, isCorrect: false, isSecondPlace: false, points: 0,
      }));
      phaseContent = (
        <DisplayResultVotes
          quizNumber={quizDisplay?.quizNumber ?? resultQuizNumber}
          question={quizDisplay?.question || resultQuestion || ''}
          statistics={announceStats}
          showAnswer={false}
          showVotes={false}
        />
      );
      break;
    }
    case GamePhase.RESULT_SHOWING_ANSWER:
      phaseContent = (
        <DisplayResultVotes
          quizNumber={resultQuizNumber}
          question={resultQuestion || quizDisplay?.question || ''}
          statistics={resultStats ?? []}
          showAnswer={true}
          showVotes={false}
          explanation={resultExplanation}
        />
      );
      break;
    case GamePhase.RESULT_SHOWING_VOTES:
      phaseContent = (
        <DisplayResultVotes
          quizNumber={resultQuizNumber}
          question={resultQuestion || quizDisplay?.question || ''}
          statistics={resultStats ?? []}
          showAnswer={true}
          showVotes={true}
          explanation={resultExplanation}
        />
      );
      break;
    case GamePhase.RESULT_SHOWING_POINTS:
      phaseContent = <DisplayResultPoints quizNumber={resultQuizNumber} />;
      break;
    case GamePhase.INTERIM_LEADERBOARD:
      phaseContent = (
        <DisplayInterimLeaderboard
          completedQuizCount={interimLeaderboard?.completedQuizCount ?? 0}
          totalQuizCount={totalQuizCount}
          topEntries={interimLeaderboard?.topEntries ?? []}
        />
      );
      break;
    case GamePhase.FINAL_RESULT:
      phaseContent = finalResult ? (
        <DisplayFinalResult
          finalResult={finalResult}
          initialWinnerRevealed={winnerRevealed}
          skipAnimation={finalResultSkipAnimation}
        />
      ) : (
        <DisplayResultPoints quizNumber={resultQuizNumber} />
      );
      break;
    case GamePhase.GAME_OVER:
      phaseContent = finalResult ? (
        <DisplayGameOver finalResult={finalResult} />
      ) : (
        <DisplayResultPoints quizNumber={resultQuizNumber} />
      );
      break;
    default:
      phaseContent = <div style={styles.fullCenter}><p style={{ color: '#94a3b8' }}>不明なフェーズ: {phase}</p></div>;
  }

  return (
    <>
      {phaseContent}
      <StampOverlay stamps={activeStamps} />
    </>
  );
}

const styles = {
  center: { ...ui.pageCenter, ...displayPage, color: colors.textPrimary },
  card: { ...ui.card, textAlign: 'center' as const },
  spinner: ui.spinnerLarge,
  fullCenter: { ...ui.pageCenter, ...displayPage, flexDirection: 'column' as const } as React.CSSProperties,
};
