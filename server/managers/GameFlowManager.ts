import type {
  RoomState,
  GamePhase,
  Quiz,
  QuizResult,
  ChoiceStatistics,
  PlayerQuizResult,
  LeaderboardEntry,
  FinalResult,
} from '../../types/game';
import { GamePhase as GamePhaseEnum } from '../../types/game';

/**
 * ゲーム進行管理クラス
 */
export class GameFlowManager {
  /**
   * 状態遷移が有効かチェック
   */
  validatePhaseTransition(currentPhase: GamePhase, action: string): boolean {
    const validTransitions: Record<GamePhase, string[]> = {
      [GamePhaseEnum.LOBBY]: ['startGame'],
      [GamePhaseEnum.RECEPTION_CLOSED]: ['showIntro'],
      [GamePhaseEnum.GAME_INTRO]: ['goToQuizPrep'],
      [GamePhaseEnum.QUIZ_PREPARE]: ['startQuizShow'],
      [GamePhaseEnum.QUIZ_SHOWING_QUESTION]: ['nextQuizShowStep'],
      [GamePhaseEnum.QUIZ_SHOWING_IMAGE]: ['nextQuizShowStep'],
      [GamePhaseEnum.QUIZ_SHOWING_CHOICES]: ['startAnswer'],
      [GamePhaseEnum.QUIZ_ACTIVE]: ['closeQuiz'],
      [GamePhaseEnum.QUIZ_CLOSED]: ['showResults'],
      [GamePhaseEnum.RESULT_SHOWING_ANNOUNCE]: ['nextResultStep'],
      [GamePhaseEnum.RESULT_SHOWING_ANSWER]: ['nextResultStep'],
      [GamePhaseEnum.RESULT_SHOWING_VOTES]: ['nextQuiz', 'endGame', 'showInterimLeaderboard'],
      [GamePhaseEnum.RESULT_SHOWING_POINTS]: [],
      [GamePhaseEnum.INTERIM_LEADERBOARD]: ['nextQuiz'],
      [GamePhaseEnum.FINAL_RESULT]: ['closeRoom'],
      [GamePhaseEnum.GAME_OVER]: [],
    };

    return validTransitions[currentPhase]?.includes(action) ?? false;
  }

  /** ゲーム開始 LOBBY → RECEPTION_CLOSED */
  startGame(room: RoomState): void {
    if (room.phase !== GamePhaseEnum.LOBBY) throw new Error('Cannot start game in current phase');
    room.phase = GamePhaseEnum.RECEPTION_CLOSED;
    room.updatedAt = Date.now();
  }

  /** イントロ表示 RECEPTION_CLOSED → GAME_INTRO */
  showIntro(room: RoomState): void {
    if (room.phase !== GamePhaseEnum.RECEPTION_CLOSED) throw new Error('Cannot show intro in current phase');
    room.phase = GamePhaseEnum.GAME_INTRO;
    room.updatedAt = Date.now();
  }

  /** 問題準備画面 GAME_INTRO → QUIZ_PREPARE */
  goToQuizPrep(room: RoomState): void {
    if (room.phase !== GamePhaseEnum.GAME_INTRO) throw new Error('Cannot go to quiz prep in current phase');
    room.phase = GamePhaseEnum.QUIZ_PREPARE;
    room.updatedAt = Date.now();
  }

  /** 出題開始 QUIZ_PREPARE → QUIZ_SHOWING_QUESTION */
  startQuizShow(room: RoomState): Quiz {
    if (room.phase !== GamePhaseEnum.QUIZ_PREPARE) throw new Error('Cannot start quiz show in current phase');

    const quizIndex = room.quizHistory.length;
    if (quizIndex >= room.preparedQuizzes.length) throw new Error('No more quizzes available');

    const quizForm = room.preparedQuizzes[quizIndex];
    const now = Date.now();

    const quiz: Quiz = {
      quizNumber: quizIndex + 1,
      question: quizForm.question,
      questionImage: quizForm.questionImage,
      choices: quizForm.choices,
      correctIndex: quizForm.correctAnswer,
      timeLimit: quizForm.timeLimit,
      startedAt: now,
      endsAt: now + quizForm.timeLimit * 1000,
      explanation: quizForm.explanation,
    };

    room.currentQuiz = quiz;
    room.phase = GamePhaseEnum.QUIZ_SHOWING_QUESTION;
    room.updatedAt = now;
    return quiz;
  }

  /** 出題ステップ進行 SHOWING_QUESTION → SHOWING_IMAGE or SHOWING_CHOICES */
  nextQuizShowStep(room: RoomState): GamePhase {
    if (room.phase === GamePhaseEnum.QUIZ_SHOWING_QUESTION) {
      room.phase = room.currentQuiz?.questionImage
        ? GamePhaseEnum.QUIZ_SHOWING_IMAGE
        : GamePhaseEnum.QUIZ_SHOWING_CHOICES;
    } else if (room.phase === GamePhaseEnum.QUIZ_SHOWING_IMAGE) {
      room.phase = GamePhaseEnum.QUIZ_SHOWING_CHOICES;
    } else {
      throw new Error('Cannot advance quiz show in current phase');
    }
    room.updatedAt = Date.now();
    return room.phase;
  }

  /** 回答受付開始 QUIZ_SHOWING_CHOICES → QUIZ_ACTIVE */
  startAnswer(room: RoomState): Quiz {
    if (room.phase !== GamePhaseEnum.QUIZ_SHOWING_CHOICES) throw new Error('Cannot start answer in current phase');
    if (!room.currentQuiz) throw new Error('No current quiz');

    const now = Date.now();
    room.currentQuiz.startedAt = now;
    room.currentQuiz.endsAt = now + room.currentQuiz.timeLimit * 1000;
    room.phase = GamePhaseEnum.QUIZ_ACTIVE;
    room.updatedAt = now;
    return room.currentQuiz;
  }

  /** 現在の問題の回答数を取得 */
  getAnswerCount(room: RoomState): { answerCount: number; totalPlayers: number } {
    if (!room.currentQuiz) return { answerCount: 0, totalPlayers: room.players.size };
    const qn = room.currentQuiz.quizNumber;
    let count = 0;
    room.players.forEach(p => { if (p.answers.some(a => a.quizNumber === qn)) count++; });
    return { answerCount: count, totalPlayers: room.players.size };
  }

  /** 回答締切・採点 QUIZ_ACTIVE → QUIZ_CLOSED */
  closeQuiz(room: RoomState): QuizResult {
    if (room.phase !== GamePhaseEnum.QUIZ_ACTIVE) throw new Error('Quiz is not active');
    if (!room.currentQuiz) throw new Error('No current quiz');

    const quiz = room.currentQuiz;
    const qn = quiz.quizNumber;

    // 得票集計
    const voteCounts: [number, number, number, number] = [0, 0, 0, 0];
    room.players.forEach(p => {
      const ans = p.answers.find(a => a.quizNumber === qn);
      if (ans) voteCounts[ans.choiceIndex]++;
    });

    const totalAnswers = voteCounts.reduce((a, b) => a + b, 0);

    // 2位の得票数を決定（同率対応）
    const sortedIdx = [0, 1, 2, 3].sort((a, b) => voteCounts[b] - voteCounts[a]);
    let secondPlaceChoice = -1;
    let secondCount = -1;
    if (totalAnswers > 0) {
      const firstCount = voteCounts[sortedIdx[0]];
      for (let i = 1; i < 4; i++) {
        const c = voteCounts[sortedIdx[i]];
        if (c < firstCount) { secondCount = c; secondPlaceChoice = sortedIdx[i]; break; }
      }
    }
    // 同率2位判定：得票数が secondCount と同じ選択肢はすべて2位
    const isSecondPlaceIdx = (idx: number) => secondCount >= 0 && voteCounts[idx] === secondCount;

    // 統計情報
    const statistics: ChoiceStatistics[] = [0, 1, 2, 3].map(idx => {
      const voteCount = voteCounts[idx];
      const percentage = totalAnswers > 0 ? (voteCount / totalAnswers) * 100 : 0;
      const isCorrect = idx === quiz.correctIndex;
      const isSecondPlace = isSecondPlaceIdx(idx);
      const points = (isCorrect && isSecondPlace) ? 3 : isSecondPlace ? 2 : isCorrect ? 1 : 0;

      // 順位計算
      let rank = 1;
      for (let i = 0; i < 4; i++) {
        if (i !== idx && voteCounts[i] > voteCount) rank++;
      }

      return { choiceIndex: idx, text: quiz.choices[idx].text, voteCount, percentage, rank, isCorrect, isSecondPlace, points };
    });

    // プレイヤーごとの結果・スコア更新
    const playerResults: Record<string, PlayerQuizResult> = {};
    room.players.forEach(player => {
      const ans = player.answers.find(a => a.quizNumber === qn);
      if (!ans) return;

      const wasCorrect = ans.choiceIndex === quiz.correctIndex;
      const isSecondPlace = isSecondPlaceIdx(ans.choiceIndex);
      const earnedPoints = (wasCorrect && isSecondPlace) ? 3 : isSecondPlace ? 2 : wasCorrect ? 1 : 0;

      ans.earnedPoints = earnedPoints;
      ans.wasCorrect = wasCorrect;
      player.totalScore += earnedPoints;

      playerResults[player.id] = { playerId: player.id, playerName: player.name, choiceIndex: ans.choiceIndex, earnedPoints, wasCorrect, isSecondPlace };
    });

    // 順位更新（同率対応）
    const sorted = [...room.players.values()].sort((a, b) => b.totalScore - a.totalScore);
    sorted.forEach((p, i) => {
      p.rank = i > 0 && sorted[i - 1].totalScore === p.totalScore ? sorted[i - 1].rank : i + 1;
    });

    const leaderboard: LeaderboardEntry[] = sorted.map(p => ({
      playerId: p.id, playerName: p.name, totalScore: p.totalScore, rank: p.rank,
    }));

    const result: QuizResult = { quizNumber: qn, question: quiz.question, correctIndex: quiz.correctIndex, voteCounts, statistics, secondPlaceChoice, playerResults, leaderboard };

    room.quizHistory.push(result);
    room.phase = GamePhaseEnum.QUIZ_CLOSED;
    room.updatedAt = Date.now();
    return result;
  }

  /** 結果表示開始 QUIZ_CLOSED → RESULT_SHOWING_ANNOUNCE */
  showResults(room: RoomState): void {
    if (room.phase !== GamePhaseEnum.QUIZ_CLOSED) throw new Error('Cannot show results in current phase');
    room.phase = GamePhaseEnum.RESULT_SHOWING_ANNOUNCE;
    room.updatedAt = Date.now();
  }

  /** 結果フェーズ進行 ANNOUNCE→ANSWER→VOTES */
  nextResultStep(room: RoomState): void {
    if (room.phase === GamePhaseEnum.RESULT_SHOWING_ANNOUNCE) {
      room.phase = GamePhaseEnum.RESULT_SHOWING_ANSWER;
    } else if (room.phase === GamePhaseEnum.RESULT_SHOWING_ANSWER) {
      room.phase = GamePhaseEnum.RESULT_SHOWING_VOTES;
    } else {
      throw new Error('Cannot advance result step in current phase');
    }
    room.updatedAt = Date.now();
  }

  /** 途中経過発表 RESULT_SHOWING_VOTES → INTERIM_LEADERBOARD */
  showInterimLeaderboard(room: RoomState): void {
    if (room.phase !== GamePhaseEnum.RESULT_SHOWING_VOTES) throw new Error('Cannot show interim leaderboard in current phase');
    room.phase = GamePhaseEnum.INTERIM_LEADERBOARD;
    room.updatedAt = Date.now();
  }

  /** 次の問題へ RESULT_SHOWING_VOTES / RESULT_SHOWING_POINTS / INTERIM_LEADERBOARD → QUIZ_PREPARE */
  nextQuiz(room: RoomState): void {
    if (
      room.phase !== GamePhaseEnum.RESULT_SHOWING_VOTES &&
      room.phase !== GamePhaseEnum.RESULT_SHOWING_POINTS &&
      room.phase !== GamePhaseEnum.INTERIM_LEADERBOARD
    ) throw new Error('Cannot go to next quiz in current phase');
    room.currentQuiz = null;
    room.phase = GamePhaseEnum.QUIZ_PREPARE;
    room.updatedAt = Date.now();
  }

  /** ゲーム終了 RESULT_SHOWING_VOTES / RESULT_SHOWING_POINTS → FINAL_RESULT */
  endGame(room: RoomState): FinalResult {
    if (
      room.phase !== GamePhaseEnum.RESULT_SHOWING_VOTES &&
      room.phase !== GamePhaseEnum.RESULT_SHOWING_POINTS
    ) throw new Error('Cannot end game in current phase');

    const sorted = [...room.players.values()].sort((a, b) => b.totalScore - a.totalScore);
    const leaderboard: LeaderboardEntry[] = sorted.map(p => ({ playerId: p.id, playerName: p.name, totalScore: p.totalScore, rank: p.rank }));

    let totalAnswerTime = 0, totalAnswerCount = 0;
    let hardestQuiz = { quizNumber: 1, question: '', correctRate: 101 };
    let easiestQuiz = { quizNumber: 1, question: '', correctRate: -1 };

    room.quizHistory.forEach(res => {
      const total = res.voteCounts.reduce((a, b) => a + b, 0);
      const correctRate = total > 0 ? (res.voteCounts[res.correctIndex] / total) * 100 : 0;
      if (correctRate < hardestQuiz.correctRate) hardestQuiz = { quizNumber: res.quizNumber, question: res.question, correctRate };
      if (correctRate > easiestQuiz.correctRate) easiestQuiz = { quizNumber: res.quizNumber, question: res.question, correctRate };

      Object.values(res.playerResults).forEach(pr => {
        const player = room.players.get(pr.playerId);
        const ans = player?.answers.find(a => a.quizNumber === res.quizNumber);
        if (ans) { totalAnswerTime += ans.timeSpent; totalAnswerCount++; }
      });
    });

    const now = Date.now();
    const finalResult: FinalResult = {
      roomId: room.roomId,
      totalQuizCount: room.quizHistory.length,
      totalPlayers: room.players.size,
      winner: leaderboard[0] ?? { playerId: '', playerName: '—', totalScore: 0, rank: 1 },
      leaderboard,
      statistics: {
        averageAnswerTime: totalAnswerCount > 0 ? totalAnswerTime / totalAnswerCount : 0,
        hardestQuiz: hardestQuiz.correctRate > 100 ? { quizNumber: 1, question: '', correctRate: 0 } : hardestQuiz,
        easiestQuiz: easiestQuiz.correctRate < 0 ? { quizNumber: 1, question: '', correctRate: 0 } : easiestQuiz,
      },
      startedAt: room.createdAt,
      endedAt: now,
    };

    room.phase = GamePhaseEnum.FINAL_RESULT;
    room.updatedAt = now;
    return finalResult;
  }

  /** ルームクローズ FINAL_RESULT → GAME_OVER */
  closeRoom(room: RoomState): void {
    if (room.phase !== GamePhaseEnum.FINAL_RESULT) throw new Error('Cannot close room in current phase');
    room.phase = GamePhaseEnum.GAME_OVER;
    room.updatedAt = Date.now();
  }

  /** ゲームリセット（LOBBYフェーズに戻す） */
  resetGame(room: RoomState): void {
    room.phase = GamePhaseEnum.LOBBY;
    room.currentQuiz = null;
    room.quizHistory = [];
    // テンプレートは保持（ルーム作成時に設定済みのため）
    room.settings.totalQuizCount = room.preparedQuizzes.length;
    room.players.forEach(player => {
      player.totalScore = 0;
      player.rank = 0;
      player.answers = [];
    });
    room.updatedAt = Date.now();
  }
}
