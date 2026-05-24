import { useState, useEffect, useRef } from 'react';
import { colors, ui, spacing, fontSize, radius, fontFamily } from '../../../styles/theme';
import logoUrl from '../../../qno2_logo.png';
import type { SelectTemplateRequest } from '../../../../types/events';
import type { TemplateInfo, QuizTemplate } from '../../../../types/game';

interface HostSetupProps {
  onCreateRoom: (maxPlayers: number, defaultTimeLimit: number, template: SelectTemplateRequest) => void;
  error: string | null;
}

export default function HostSetup({ onCreateRoom, error }: HostSetupProps) {
  const [maxPlayers, setMaxPlayers] = useState(100);
  const [defaultTimeLimit, setDefaultTimeLimit] = useState(30);
  const [loading, setLoading] = useState(false);

  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<{ request: SelectTemplateRequest; title: string; count: number } | null>(null);
  const [uploadedTemplate, setUploadedTemplate] = useState<{ title: string; count: number } | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    fetch(`${apiBase}/api/templates`)
      .then((res) => res.json())
      .then((data: { templates: TemplateInfo[] }) => {
        setTemplates(data.templates);
        setLoadingTemplates(false);
      })
      .catch(() => setLoadingTemplates(false));
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '') {
      setSelectedTemplate(null);
      return;
    }
    const t = templates.find(t => t.id === val);
    if (!t) return;
    setSelectedTemplate({ request: { source: 'server', templateId: t.id }, title: t.title, count: t.totalQuizCount });
    setUploadedTemplate(null);
    setTemplateError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const template = JSON.parse(event.target?.result as string) as QuizTemplate;
        const info = { title: template.title, count: template.quizzes.length };
        setSelectedTemplate({ request: { source: 'upload', template }, title: template.title, count: template.quizzes.length });
        setUploadedTemplate(info);
        setTemplateError(null);
      } catch {
        setTemplateError('JSONファイルの形式が正しくありません');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = () => {
    if (!selectedTemplate) return;
    setLoading(true);
    onCreateRoom(maxPlayers, defaultTimeLimit, selectedTemplate.request);
  };

  const canCreate = !!selectedTemplate;

  const selectedServerId =
    selectedTemplate?.request.source === 'server'
      ? (selectedTemplate.request as { source: 'server'; templateId: string }).templateId
      : '';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={logoUrl} alt="Quiz No.2" style={styles.logo} />
        <p style={styles.subtitle}>ホスト画面</p>

        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>最大参加者数</label>
            <input
              type="number"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              min={10}
              max={100}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>デフォルト回答時間（秒）</label>
            <input
              type="number"
              value={defaultTimeLimit}
              onChange={(e) => setDefaultTimeLimit(Number(e.target.value))}
              min={10}
              max={120}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>問題テンプレート</label>

            {loadingTemplates ? (
              <p style={styles.loadingText}>読み込み中...</p>
            ) : (
              <select
                value={selectedServerId}
                onChange={handleSelectChange}
                style={styles.select}
                disabled={loading}
              >
                <option value="">テンプレートを選択...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}（{t.totalQuizCount}問）
                  </option>
                ))}
              </select>
            )}

            <div style={styles.uploadRow}>
              <button
                style={styles.uploadButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                📂 JSONをアップロード
              </button>
              {uploadedTemplate && (
                <span style={styles.uploadedInfo}>
                  {uploadedTemplate.title}（{uploadedTemplate.count}問）
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            {templateError && <p style={styles.templateError}>{templateError}</p>}
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading || !canCreate}
            style={{ ...styles.button, ...(loading || !canCreate ? styles.buttonDisabled : {}) }}
          >
            {loading ? 'ルーム作成中...' : 'ゲームを作成'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageCenter, background: colors.bgDeep },
  card: ui.card,
  logo: { width: '360px', display: 'block', margin: `0 auto ${spacing['2']}` },
  subtitle: { fontFamily: fontFamily.display, fontSize: fontSize['2xl'], textAlign: 'center', marginBottom: spacing['4'], color: colors.textPrimary },
  form: { display: 'flex', flexDirection: 'column', gap: spacing['5'] },
  formGroup: { display: 'flex', flexDirection: 'column', gap: spacing['2'] },
  label: { fontSize: fontSize.sm, fontWeight: 500, color: colors.textDim },
  input: { padding: spacing['3'], borderRadius: radius.md, border: `1px solid ${colors.border}`, background: colors.bgDeep, color: colors.textSecondary, fontSize: fontSize.base },
  select: { padding: spacing['3'], borderRadius: radius.md, border: `1px solid ${colors.border}`, background: colors.bgDeep, color: colors.textSecondary, fontSize: fontSize.base, cursor: 'pointer' },
  uploadRow: { display: 'flex', alignItems: 'center', gap: spacing['3'] },
  uploadButton: { flex: 1, padding: `${spacing['3']} ${spacing['4']}`, background: colors.border, border: `2px dashed ${colors.neutral}`, borderRadius: radius.md, color: colors.textBody, fontSize: fontSize.sm, fontWeight: 500, cursor: 'pointer', textAlign: 'center' },
  uploadedInfo: { fontSize: fontSize.sm, color: colors.green, fontWeight: 500 },
  templateError: { fontSize: fontSize.caption, color: colors.redLight, margin: 0 },
  loadingText: { color: colors.textSecondary, fontSize: fontSize.sm, margin: 0 },
  button: { ...ui.buttonBlue, padding: '14px', fontSize: fontSize.base, fontWeight: 600, transition: 'background 0.2s' },
  buttonDisabled: { background: colors.neutral, cursor: 'not-allowed' },
  error: { padding: spacing['3'], borderRadius: radius.md, background: colors.redDeep, color: '#fecaca', fontSize: fontSize.sm },
};
