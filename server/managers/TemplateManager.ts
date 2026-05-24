import * as fs from 'fs';
import * as path from 'path';
import type { QuizTemplate, TemplateInfo, QuizForm } from '../../types/game';

export class TemplateManager {
  private readonly templateDir = path.join(__dirname, '../templates');

  /**
   * サーバーに配置されたテンプレート一覧を返す
   */
  getTemplateList(): TemplateInfo[] {
    if (!fs.existsSync(this.templateDir)) return [];

    const files = fs.readdirSync(this.templateDir).filter((f) => f.endsWith('.json'));
    const templates: TemplateInfo[] = [];

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(this.templateDir, file), 'utf-8');
        const template = JSON.parse(raw) as QuizTemplate;
        const id = file.replace('.json', '');
        templates.push({
          id,
          title: template.title,
          description: template.description,
          totalQuizCount: template.quizzes.length,
          source: 'server',
        });
      } catch {
        // 読み込み失敗したファイルはスキップ
      }
    }

    return templates;
  }

  /**
   * サーバーテンプレートをIDで読み込む
   */
  loadServerTemplate(templateId: string): QuizTemplate {
    // パストラバーサル対策
    const safeName = path.basename(templateId);
    const filePath = path.join(this.templateDir, `${safeName}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`テンプレートが見つかりません: ${templateId}`);
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as QuizTemplate;
  }

  /**
   * テンプレートをバリデーション
   * エラーメッセージの配列を返す（空なら有効）
   */
  validate(template: QuizTemplate): string[] {
    const errors: string[] = [];

    if (!template.title || typeof template.title !== 'string') {
      errors.push('title が必要です');
    }
    if (!template.version || typeof template.version !== 'string') {
      errors.push('version が必要です');
    }
    if (!template.settings || typeof template.settings.defaultTimeLimit !== 'number') {
      errors.push('settings.defaultTimeLimit（数値）が必要です');
    }
    if (!Array.isArray(template.quizzes) || template.quizzes.length === 0) {
      errors.push('quizzes は1問以上必要です');
    } else {
      template.quizzes.forEach((quiz, i) => {
        const n = i + 1;
        if (!quiz.question) errors.push(`問題${n}: question が必要です`);
        if (!Array.isArray(quiz.choices) || quiz.choices.length !== 4) {
          errors.push(`問題${n}: choices は4つ必要です`);
        }
        if (typeof quiz.correctAnswer !== 'number' || quiz.correctAnswer < 0 || quiz.correctAnswer > 3) {
          errors.push(`問題${n}: correctAnswer は 0〜3 の整数が必要です`);
        }
      });
    }

    return errors;
  }

  /**
   * QuizTemplate → QuizForm[] に変換（サーバー内部形式）
   */
  toQuizForms(template: QuizTemplate, defaultTimeLimit?: number): QuizForm[] {
    const resolvedDefault = defaultTimeLimit ?? template.settings?.defaultTimeLimit ?? 30;

    const quizzes = template.settings?.shuffleQuestions
      ? [...template.quizzes].sort(() => Math.random() - 0.5)
      : template.quizzes;

    return quizzes.map((quiz) => {
      let choices = quiz.choices;
      let correctAnswer = quiz.correctAnswer;

      if (template.settings?.shuffleChoices) {
        const indexed = quiz.choices.map((text, i) => ({ text, i }));
        indexed.sort(() => Math.random() - 0.5);
        choices = indexed.map((c) => c.text) as typeof quiz.choices;
        correctAnswer = indexed.findIndex((c) => c.i === quiz.correctAnswer) as typeof quiz.correctAnswer;
      }

      return {
        question: quiz.question,
        questionImage: quiz.image?.url,
        choices: choices.map((text) => ({ text })) as [
          { text: string },
          { text: string },
          { text: string },
          { text: string },
        ],
        correctAnswer,
        timeLimit: quiz.timeLimit ?? resolvedDefault,
        explanation: quiz.explanation,
      };
    });
  }
}
