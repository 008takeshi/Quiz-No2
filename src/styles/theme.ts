import type { CSSProperties } from 'react';
import bgUrl from '../qno2_bg.png';

// ===== カラートークン =====
export const colors = {
  // 背景（ロゴカラー：深い紫）
  bgDeep: '#1A0B2E',
  bgCard: '#98F5E1',
  bgSub: '#e9edc9',
  bgInput: '#000000',

  // ボーダー / 区切り線
  border: '#7b2cbf',
  // ボタン・バッジのアウトライン（ロゴの太枠）
  stroke: '#0d001a',

  // テキスト
  textPrimary: '#7b2cbf',
  textBody: '#e9edc9',
  textSecondary: '#ffffff',
  textMuted: '#9b72cf',
  textDim: '#1A0B2E',
  textAlert: '#9d0208',

  // ニュートラル
  neutral: '#5a3e7a',

  // プライマリ（紫）
  blue: '#9d4edd',
  blueDark: '#7b2cbf',
  blueDarker: '#7b2cbf',
  blueLight: '#c3a1e6',
  bluePale: '#e9edc9',
  purple: '#9d4edd',

  // グリーン（成功 / 正解）
  green: '#52b788',
  greenDark: '#2d6a4f',
  greenDeep: '#1b4332',
  greenLight: '#74c69d',
  greenBg: '#0a2218',

  // レッド（エラー / 不正解）
  red: '#e63946',
  redDark: '#c1121f',
  redLight: '#ff8fa3',
  redBg: '#2d0a0c',
  redDeep: '#9d0208',

  // ゴールド（アクセント / 重要ボタン / 警告）
  amber: '#ffd60a',
  amberDark: '#f4b400',
  amberLight: '#ffe566',
  amberDeep: '#7c6300',

  // タイマー
  timerNormal: '#52b788',
  timerUrgent: '#e63946',

  // ゴールド（優勝）
  gold: '#ffd60a',
  goldDeep: '#7c6300',
  goldBg: '#1a1200',

  // オレンジ（3位）
  orange: '#f77f00',
} as const;

// ===== フォントファミリー =====
export const fontFamily = {
  /** 標準本文・ボタン（丸みのある日本語） */
  body:    "'M PLUS Rounded 1c', -apple-system, BlinkMacSystemFont, sans-serif",
  /** タイトル・見出し用の超極太日本語ディスプレイフォント */
  display: "'Dela Gothic One', 'M PLUS Rounded 1c', sans-serif",
} as const;

// ===== スペーシング（4px 基数スケール）=====
export const spacing = {
  '1':  '4px',
  '2':  '8px',
  '3':  '12px',
  '4':  '16px',
  '5':  '20px',
  '6':  '24px',
  '7':  '28px',
  '8':  '32px',
  '10': '40px',
  '12': '48px',
  '15': '60px',
  '20': '80px',
} as const;

// ===== フォントサイズ =====
export const fontSize = {
  hint:       '11px',  // 極小ヒント・注釈
  caption:    '13px',  // バッジ・ラベル
  sm:         '14px',  // 小さめ本文
  base:       '16px',  // 標準本文・ボタン
  lg:         '18px',  // やや大きめ本文・ボタン
  xl:         '20px',  // 小見出し
  '2xl':      '24px',  // 見出し
  '3xl':      '28px',  // セクション見出し
  '4xl':      '32px',  // タイトル
  '5xl':      '36px',  // 大タイトル
  '6xl':      '40px',  // 問題文（大画面）
  display:    '48px',  // ディスプレイ見出し
  displayLg:  '64px',  // ディスプレイ大
  displayXl:  '72px',  // ディスプレイ特大（タイマー・ルームコード）
  displayHero: '96px', // ディスプレイ超特大（アイコン系）
} as const;

// ===== ディスプレイ画面専用ページレイアウト上書き =====
// ui.pageCenter / pageColumn はホストでも使うため minHeight のまま。
// 共有画面コンポーネントでこれをスプレッドして height: 100vh / overflow: hidden に上書きする。
export const displayPage: CSSProperties = {
  height: '100vh',
  overflow: 'hidden',
  boxSizing: 'border-box',
};

// ===== ディスプレイ画面用レスポンシブフォントサイズ（基準 1080p、vh でスケール）=====
export const displayFontSize = {
  caption:     'clamp(10px, 1.2vh, 13px)',
  sm:          'clamp(11px, 1.3vh, 14px)',
  base:        'clamp(12px, 1.5vh, 16px)',
  lg:          'clamp(14px, 1.7vh, 18px)',
  xl:          'clamp(16px, 1.85vh, 20px)',
  '2xl':       'clamp(18px, 2.2vh, 24px)',
  '3xl':       'clamp(20px, 2.6vh, 28px)',
  '4xl':       'clamp(22px, 3vh, 32px)',
  '5xl':       'clamp(26px, 3.3vh, 36px)',
  '6xl':       'clamp(28px, 3.7vh, 40px)',
  display:     'clamp(32px, 4.4vh, 48px)',
  displayLg:   'clamp(44px, 5.9vh, 64px)',
  displayXl:   'clamp(36px, 6.7vh, 72px)',
} as const;

// ===== ディスプレイ画面用レスポンシブスペーシング（基準 1080p、vh でスケール）=====
export const displaySpacing = {
  '1':  'clamp(2px, 0.37vh, 4px)',
  '2':  'clamp(4px, 0.74vh, 8px)',
  '3':  'clamp(6px, 1.1vh, 12px)',
  '4':  'clamp(8px, 1.5vh, 16px)',
  '5':  'clamp(10px, 1.85vh, 20px)',
  '6':  'clamp(12px, 2.2vh, 24px)',
  '7':  'clamp(14px, 2.6vh, 28px)',
  '8':  'clamp(16px, 3vh, 32px)',
  '10': 'clamp(20px, 3.7vh, 40px)',
  '12': 'clamp(24px, 4.4vh, 48px)',
  '15': 'clamp(30px, 5.6vh, 60px)',
  '20': 'clamp(40px, 7.4vh, 80px)',
} as const;

// ===== ボーダーラジウス =====
export const radius = {
  sm:     '4px',    // 極小（バー塗り等）
  md:     '8px',    // ボタン・インプット
  lg:     '12px',   // カード・選択肢
  xl:     '16px',   // 大きめカード
  '2xl':  '20px',   // モーダル等
  full:   '999px',  // ピル型バッジ
  circle: '50%',    // 円形（スピナー・アイコン）
} as const;

// ===== グラデーション =====
export const gradients = {
  bgPage:    `linear-gradient(135deg, ${colors.bgDeep} 0%, ${colors.bgCard} 100%)`,
  card:      `linear-gradient(160deg, ${colors.bgCard}, ${colors.bgSub})`,
  primary:   `linear-gradient(135deg, ${colors.blueDark} 0%, ${colors.purple} 100%)`,
  progress:  `linear-gradient(90deg, ${colors.green}, ${colors.greenDark})`,
  startQuiz: `linear-gradient(135deg, ${colors.green} 0%, ${colors.greenDark} 100%)`,
  endGame:   `linear-gradient(135deg, ${colors.amber} 0%, ${colors.amberDark} 100%)`,
} as const;

// ===== 選択肢カラー（A/B/C/D）=====
export const choiceColors = [
  { bg: '#150b2c', border: colors.purple,  active: colors.blueDark, label: colors.blueLight },
  { bg: '#0a2218', border: colors.green,   active: colors.greenDark, label: colors.greenLight },
  { bg: '#2d0a0c', border: colors.red,     active: colors.redDark,   label: colors.redLight },
  { bg: '#1a1200', border: colors.amber,   active: colors.amberDark, label: colors.amberLight },
] as const;

/** 背景色のみ（Host / Display の choice リスト用）*/
export const choiceBgs     = choiceColors.map(c => c.bg);
/** ボーダー / アクセント色（棒グラフ等）*/
export const choiceAccents = choiceColors.map(c => c.border);
export const choiceLetters = ['A', 'B', 'C', 'D'] as const;

// ===== ランキング =====
export const rankColors = [colors.gold, colors.textSecondary, colors.orange] as const;
export const rankEmoji  = ['🥇', '🥈', '🥉'] as const;

// ===== 共通 UI スタイル =====
export const ui: Record<string, CSSProperties> = {
  // --- ページレイアウト ---
  pageCenter: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['5'],
    backgroundColor: colors.bgDeep,
    backgroundImage: `url(${bgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  pageCenterGradient: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['5'],
    backgroundColor: colors.bgDeep,
    backgroundImage: `url(${bgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  pageColumn: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bgDeep,
    backgroundImage: `url(${bgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    padding: `${spacing['8']} ${spacing['10']}`,
  },

  // --- カード ---
  card: {
    background: gradients.card,
    borderRadius: radius['2xl'],
    padding: spacing['10'],
    maxWidth: '500px',
    width: '100%',
    
    boxShadow: '0 10px 40px rgba(227, 229, 217, 0.6)',
  },
  cardBordered: {
    background: gradients.card,
    borderRadius: radius['2xl'],
    padding: spacing['10'],
    maxWidth: '500px',
    width: '100%',
    border: `2px solid ${colors.border}`,
    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
  },
  cardWide: {
    background: gradients.card,
    borderRadius: radius['2xl'],
    padding: spacing['10'],
    maxWidth: '700px',
    width: '100%',
    border: `2px solid ${colors.border}`,
    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
  },

  // --- スピナー ---
  spinner: {
    width: spacing['10'],
    height: spacing['10'],
    margin: `0 auto ${spacing['4']}`,
    border: `4px solid ${colors.border}`,
    borderTop: `4px solid ${colors.blue}`,
    borderRadius: radius.circle,
    animation: 'spin 1s linear infinite',
  },
  spinnerLarge: {
    width: fontSize.displayLg,
    height: fontSize.displayLg,
    margin: `0 auto ${spacing['6']}`,
    border: `6px solid ${colors.border}`,
    borderTop: `6px solid ${colors.blue}`,
    borderRadius: radius.circle,
    animation: 'spin 1s linear infinite',
  },

  // --- ボタン ---
  // ゴールド＋オフセット影（ロゴスタイルの重要アクション用）
  buttonPrimary: {
    width: '100%',
    padding: spacing['4'],
    borderRadius: radius.lg,
    border: `3px solid ${colors.stroke}`,
    background: colors.gold,
    color: colors.bgDeep,
    fontSize: fontSize.lg,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
    boxShadow: `4px 4px 0px ${colors.blueDark}`,
  },
  buttonBlue: {
    padding: `14px ${spacing['10']}`,
    background: colors.purple,
    color: '#fff',
    border: `3px solid ${colors.stroke}`,
    borderRadius: radius.lg,
    fontSize: fontSize.lg,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: `4px 4px 0px ${colors.blueDark}`,
  },
  buttonNeutral: {
    padding: '14px',
    background: colors.neutral,
    color: colors.textSecondary,
    border: 'none',
    borderRadius: radius.md,
    fontSize: fontSize.base,
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonDanger: {
    width: '100%',
    padding: '14px',
    borderRadius: radius.lg,
    border: `3px solid ${colors.stroke}`,
    background: colors.redDark,
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: `4px 4px 0px ${colors.redDeep}`,
  },
  buttonGreen: {
    width: '100%',
    padding: spacing['4'],
    borderRadius: radius.lg,
    border: `3px solid ${colors.stroke}`,
    background: colors.green,
    color: colors.bgDeep,
    fontSize: fontSize.xl,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: `4px 4px 0px ${colors.greenDark}`,
  },
  buttonAmber: {
    width: '100%',
    padding: spacing['4'],
    borderRadius: radius.lg,
    border: `3px solid ${colors.stroke}`,
    background: colors.gold,
    color: colors.bgDeep,
    fontSize: fontSize.lg,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: `4px 4px 0px ${colors.amberDark}`,
  },

  // --- データ表示エリア（暗い背景のインセットボックス）---
  insetBox: {
    background: colors.bgInput,
    borderRadius: radius.lg,
    padding: spacing['6'],
  },

  // --- バッジ（問題番号・フェーズラベル）---
  quizBadge: {
    background: colors.blueDark,
    color: colors.gold,
    borderRadius: radius.full,
    padding: `6px ${spacing['4']}`,
    fontSize: fontSize.caption,
    fontWeight: 700,
    border: `2px solid ${colors.gold}`,
  },
  quizBadgeLarge: {
    background: colors.blueDark,
    color: colors.gold,
    borderRadius: radius.full,
    padding: `${spacing['2']} ${spacing['5']}`,
    fontSize: fontSize.base,
    fontWeight: 700,
    border: `2px solid ${colors.gold}`,
  },
};

/** `colors` の全エントリを CSS カスタムプロパティとして :root に注入する */
export function injectCSSVariables(): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(colors)) {
    const varName = `--color-${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`;
    root.style.setProperty(varName, value);
  }
}
