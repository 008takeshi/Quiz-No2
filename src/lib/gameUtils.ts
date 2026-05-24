import type { SerializedRoomState, FinalResult, LeaderboardEntry } from '../../types/game';
import type { InterimLeaderboardShowEvent } from '../../types/events';

/**
 * SerializedRoomState から FinalResult を再構築する（再接続時用）
 */
export function reconstructFinalResult(roomState: SerializedRoomState): FinalResult {
  const players = Object.values(roomState.players);
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const leaderboard: LeaderboardEntry[] = sorted.map(p => ({
    playerId: p.id, playerName: p.name, totalScore: p.totalScore, rank: p.rank,
  }));

  const history = roomState.quizHistory;
  let totalAnswerTime = 0, totalAnswerCount = 0;
  let hardestQuiz = { quizNumber: 1, question: '', correctRate: 101 };
  let easiestQuiz = { quizNumber: 1, question: '', correctRate: -1 };
  history.forEach(res => {
    const total = res.voteCounts.reduce((a, b) => a + b, 0);
    const correctRate = total > 0 ? (res.voteCounts[res.correctIndex] / total) * 100 : 0;
    if (correctRate < hardestQuiz.correctRate) hardestQuiz = { quizNumber: res.quizNumber, question: res.question, correctRate };
    if (correctRate > easiestQuiz.correctRate) easiestQuiz = { quizNumber: res.quizNumber, question: res.question, correctRate };
    Object.values(res.playerResults).forEach(pr => {
      const player = roomState.players[pr.playerId];
      const ans = player?.answers.find(a => a.quizNumber === res.quizNumber);
      if (ans) { totalAnswerTime += ans.timeSpent; totalAnswerCount++; }
    });
  });

  return {
    roomId: roomState.roomId,
    totalQuizCount: history.length,
    totalPlayers: players.length,
    winner: leaderboard[0] ?? { playerId: '', playerName: '—', totalScore: 0, rank: 1 },
    leaderboard,
    statistics: {
      averageAnswerTime: totalAnswerCount > 0 ? totalAnswerTime / totalAnswerCount : 0,
      hardestQuiz: hardestQuiz.correctRate > 100 ? { quizNumber: 1, question: '', correctRate: 0 } : hardestQuiz,
      easiestQuiz: easiestQuiz.correctRate < 0 ? { quizNumber: 1, question: '', correctRate: 0 } : easiestQuiz,
    },
    startedAt: roomState.createdAt,
    endedAt: roomState.updatedAt,
  };
}

/**
 * SerializedRoomState から InterimLeaderboardShowEvent を再構築する（再接続時用）
 */
export function reconstructInterimLeaderboard(roomState: SerializedRoomState): InterimLeaderboardShowEvent {
  const history = roomState.quizHistory;
  const lastResult = history[history.length - 1];
  const topEntries = lastResult
    ? lastResult.leaderboard
        .filter((e, i, arr) => e.rank !== 1 || arr.findIndex(x => x.rank === 1) === i)
        .slice(0, 3)
        .map(e => ({ rank: e.rank, playerName: e.rank === 1 ? null : e.playerName, totalScore: e.totalScore, hideScore: e.rank === 1 }))
    : [];
  return {
    completedQuizCount: history.length,
    totalQuizCount: roomState.settings.totalQuizCount,
    topEntries,
  };
}
