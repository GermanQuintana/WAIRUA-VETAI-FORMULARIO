import { useMemo, useState } from 'react';
import { Language } from '../i18n';

interface Props {
  lang: Language;
}

type LimitUnit = 'words' | 'characters';
type InsightTone = 'good' | 'attention' | 'neutral';

const copy = {
  es: {
    kicker: 'Asistente editorial',
    title: 'Redacción y control de extensión',
    description:
      'Escribe o pega un texto y revisa su extensión, ritmo y estructura antes de enviarlo a una revista, congreso o plataforma editorial.',
    privacyTitle: 'Análisis local',
    privacyText: 'El contenido se procesa únicamente en tu navegador.',
    words: 'Palabras',
    characters: 'Caracteres',
    letters: 'Letras',
    readingTime: 'Lectura',
    minutes: 'min',
    lessThanMinute: '< 1 min',
    editorTitle: 'Texto de trabajo',
    editorHint: 'Los indicadores se actualizan mientras escribes.',
    placeholder:
      'Pega aquí el resumen, artículo, caso clínico o comunicación que quieras revisar…',
    copyText: 'Copiar texto',
    copied: 'Texto copiado',
    copyFailed: 'No se pudo copiar; selecciona el texto manualmente',
    cleanSpacing: 'Limpiar espacios',
    cleaned: 'Espacios corregidos',
    emptyAction: 'Añade texto para usar esta acción',
    extensionTarget: 'Objetivo de extensión',
    unit: 'Unidad',
    minimum: 'Mínimo',
    maximum: 'Máximo',
    noLimit: 'Sin límite máximo',
    withinRange: 'Extensión dentro del rango',
    belowRange: 'Faltan {count}',
    overRange: 'Sobran {count}',
    currentCount: '{count} actuales',
    analysisTitle: 'Ritmo y estructura',
    sentences: 'Frases estimadas',
    paragraphs: 'Párrafos',
    charactersNoSpaces: 'Caracteres sin espacios',
    speakingTime: 'Tiempo de locución',
    averageSentence: 'Palabras por frase',
    averageWord: 'Letras por palabra',
    reviewTitle: 'Revisión editorial',
    emptyReview: 'Empieza a escribir para recibir observaciones.',
    agileRhythm: 'El ritmo de las frases es ágil.',
    balancedRhythm: 'La longitud media de las frases es equilibrada.',
    denseRhythm: 'La longitud media es alta; prueba a dividir algunas frases.',
    longSentencesNone: 'No hay frases de más de 25 palabras.',
    longSentencesOne: '1 frase supera las 25 palabras.',
    longSentencesSome: '{count} frases superan las 25 palabras.',
    paragraphGood: 'Los párrafos mantienen una extensión manejable.',
    paragraphDense: 'Hay párrafos muy extensos; considera crear más puntos de entrada.',
    repetitionGood: 'No se detectan repeticiones dominantes.',
    repetitionAttention: '“{term}” aparece con frecuencia; revisa si todas las repeticiones son necesarias.',
    longSentencesTitle: 'Frases a revisar',
    longSentenceWords: '{count} palabras',
    noLongSentences: 'No se han detectado frases especialmente largas.',
    frequentTerms: 'Términos frecuentes',
    noFrequentTerms: 'Aún no hay suficiente texto para detectar términos.',
    limitWords: 'palabras',
    limitCharacters: 'caracteres',
  },
  en: {
    kicker: 'Editorial assistant',
    title: 'Writing and length control',
    description:
      'Write or paste text and review its length, rhythm, and structure before submitting it to a journal, conference, or editorial platform.',
    privacyTitle: 'Local analysis',
    privacyText: 'Content is processed only in your browser.',
    words: 'Words',
    characters: 'Characters',
    letters: 'Letters',
    readingTime: 'Reading',
    minutes: 'min',
    lessThanMinute: '< 1 min',
    editorTitle: 'Working text',
    editorHint: 'Indicators update as you write.',
    placeholder:
      'Paste the abstract, article, clinical case, or communication you want to review here…',
    copyText: 'Copy text',
    copied: 'Text copied',
    copyFailed: 'Could not copy; select the text manually',
    cleanSpacing: 'Clean spacing',
    cleaned: 'Spacing corrected',
    emptyAction: 'Add text to use this action',
    extensionTarget: 'Length target',
    unit: 'Unit',
    minimum: 'Minimum',
    maximum: 'Maximum',
    noLimit: 'No maximum limit',
    withinRange: 'Length is within range',
    belowRange: '{count} remaining to minimum',
    overRange: '{count} over the maximum',
    currentCount: '{count} current',
    analysisTitle: 'Rhythm and structure',
    sentences: 'Estimated sentences',
    paragraphs: 'Paragraphs',
    charactersNoSpaces: 'Characters without spaces',
    speakingTime: 'Speaking time',
    averageSentence: 'Words per sentence',
    averageWord: 'Letters per word',
    reviewTitle: 'Editorial review',
    emptyReview: 'Start writing to receive observations.',
    agileRhythm: 'Sentence rhythm is concise.',
    balancedRhythm: 'Average sentence length is balanced.',
    denseRhythm: 'Average sentence length is high; consider splitting some sentences.',
    longSentencesNone: 'No sentences exceed 25 words.',
    longSentencesOne: '1 sentence exceeds 25 words.',
    longSentencesSome: '{count} sentences exceed 25 words.',
    paragraphGood: 'Paragraphs remain at a manageable length.',
    paragraphDense: 'Some paragraphs are very long; consider adding more entry points.',
    repetitionGood: 'No dominant repetition was detected.',
    repetitionAttention: '“{term}” appears frequently; check whether every repetition is necessary.',
    longSentencesTitle: 'Sentences to review',
    longSentenceWords: '{count} words',
    noLongSentences: 'No especially long sentences were detected.',
    frequentTerms: 'Frequent terms',
    noFrequentTerms: 'There is not enough text yet to identify terms.',
    limitWords: 'words',
    limitCharacters: 'characters',
  },
} as const;

const STOP_WORDS = new Set([
  'para',
  'como',
  'este',
  'esta',
  'estos',
  'estas',
  'desde',
  'entre',
  'sobre',
  'también',
  'pero',
  'porque',
  'cuando',
  'donde',
  'cada',
  'todo',
  'toda',
  'todos',
  'todas',
  'with',
  'from',
  'this',
  'that',
  'these',
  'those',
  'into',
  'about',
  'also',
  'when',
  'where',
  'which',
  'while',
  'were',
  'been',
  'have',
  'has',
  'their',
  'there',
  'than',
  'then',
]);

const getWords = (value: string) =>
  value.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) ?? [];

const getSentences = (value: string) =>
  value
    .trim()
    .split(/(?<=[.!?…])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const replaceCount = (template: string, count: number | string) =>
  template.replace('{count}', String(count));

const formatDecimal = (lang: Language, value: number) =>
  new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);

const formatDuration = (
  lang: Language,
  wordCount: number,
  wordsPerMinute: number,
  lessThanMinute: string,
  minutes: string,
) => {
  if (wordCount === 0) return `0 ${minutes}`;
  if (wordCount < wordsPerMinute) return lessThanMinute;
  return `${new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    maximumFractionDigits: 1,
  }).format(wordCount / wordsPerMinute)} ${minutes}`;
};

export default function WritingAssistantToolkit({ lang }: Props) {
  const t = copy[lang];
  const [text, setText] = useState('');
  const [limitUnit, setLimitUnit] = useState<LimitUnit>('words');
  const [minimum, setMinimum] = useState('500');
  const [maximum, setMaximum] = useState('1000');
  const [actionFeedback, setActionFeedback] = useState('');

  const analysis = useMemo(() => {
    const words = getWords(text);
    const sentences = getSentences(text);
    const paragraphs = text
      .trim()
      .split(/\n\s*\n/u)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    const characters = Array.from(text).length;
    const letters = text.match(/\p{L}/gu)?.length ?? 0;
    const charactersNoSpaces = Array.from(text.replace(/\s/gu, '')).length;
    const sentenceWordCounts = sentences.map((sentence) => getWords(sentence).length);
    const longSentences = sentences
      .map((sentence, index) => ({ sentence, words: sentenceWordCounts[index] }))
      .filter((item) => item.words > 25)
      .sort((left, right) => right.words - left.words);
    const paragraphWordCounts = paragraphs.map((paragraph) => getWords(paragraph).length);
    const averageSentence = sentences.length ? words.length / sentences.length : 0;
    const averageWord = words.length ? letters / words.length : 0;

    const termCounts = new Map<string, number>();
    words.forEach((word) => {
      const normalized = word.toLocaleLowerCase(lang === 'es' ? 'es-ES' : 'en-US');
      if (normalized.length < 4 || STOP_WORDS.has(normalized) || /^\d+$/u.test(normalized)) return;
      termCounts.set(normalized, (termCounts.get(normalized) ?? 0) + 1);
    });
    const frequentTerms = Array.from(termCounts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], lang))
      .slice(0, 6)
      .map(([term, count]) => ({ term, count }));
    const dominantTerm = frequentTerms.find(
      (item) => item.count >= 3 && words.length > 0 && item.count / words.length >= 0.035,
    );

    return {
      words: words.length,
      characters,
      letters,
      charactersNoSpaces,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      averageSentence,
      averageWord,
      longestParagraph: Math.max(0, ...paragraphWordCounts),
      longSentences,
      frequentTerms,
      dominantTerm,
    };
  }, [lang, text]);

  const limitState = useMemo(() => {
    const current = limitUnit === 'words' ? analysis.words : analysis.characters;
    const min = Math.max(0, Number.parseInt(minimum, 10) || 0);
    const requestedMax = Math.max(0, Number.parseInt(maximum, 10) || 0);
    const max = requestedMax > 0 ? Math.max(requestedMax, min) : 0;
    const progress = max > 0 ? Math.min(100, (current / max) * 100) : 0;

    if (min > 0 && current < min) {
      return {
        tone: 'under' as const,
        message: replaceCount(t.belowRange, min - current),
        current,
        progress,
      };
    }
    if (max > 0 && current > max) {
      return {
        tone: 'over' as const,
        message: replaceCount(t.overRange, current - max),
        current,
        progress: 100,
      };
    }
    return {
      tone: 'within' as const,
      message: t.withinRange,
      current,
      progress,
    };
  }, [analysis.characters, analysis.words, limitUnit, maximum, minimum, t]);

  const insights = useMemo(() => {
    if (analysis.words === 0) return [];

    const rhythm: { text: string; tone: InsightTone } =
      analysis.averageSentence <= 18
        ? { text: t.agileRhythm, tone: 'good' }
        : analysis.averageSentence <= 25
          ? { text: t.balancedRhythm, tone: 'neutral' }
          : { text: t.denseRhythm, tone: 'attention' };
    const longSentenceInsight: { text: string; tone: InsightTone } =
      analysis.longSentences.length === 0
        ? { text: t.longSentencesNone, tone: 'good' }
        : analysis.longSentences.length === 1
          ? { text: t.longSentencesOne, tone: 'attention' }
        : {
            text: replaceCount(t.longSentencesSome, analysis.longSentences.length),
            tone: 'attention',
          };
    const paragraphInsight: { text: string; tone: InsightTone } =
      analysis.longestParagraph <= 140
        ? { text: t.paragraphGood, tone: 'good' }
        : { text: t.paragraphDense, tone: 'attention' };
    const repetitionInsight: { text: string; tone: InsightTone } = analysis.dominantTerm
      ? {
          text: t.repetitionAttention.replace('{term}', analysis.dominantTerm.term),
          tone: 'attention',
        }
      : { text: t.repetitionGood, tone: 'good' };

    return [rhythm, longSentenceInsight, paragraphInsight, repetitionInsight];
  }, [analysis, t]);

  const handleCopy = async () => {
    if (!text.trim()) {
      setActionFeedback(t.emptyAction);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setActionFeedback(t.copied);
    } catch {
      setActionFeedback(t.copyFailed);
    }
  };

  const handleCleanSpacing = () => {
    if (!text.trim()) {
      setActionFeedback(t.emptyAction);
      return;
    }
    const cleaned = text
      .split('\n')
      .map((line) => line.replace(/[ \t]+/gu, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/gu, '\n\n')
      .trim();
    setText(cleaned);
    setActionFeedback(t.cleaned);
  };

  const limitLabel = limitUnit === 'words' ? t.limitWords : t.limitCharacters;

  return (
    <section className="writing-toolkit">
      <header className="writing-toolkit-header">
        <div>
          <p className="section-kicker">{t.kicker}</p>
          <h3>{t.title}</h3>
          <p>{t.description}</p>
        </div>
        <aside className="writing-privacy-note">
          <strong>{t.privacyTitle}</strong>
          <span>{t.privacyText}</span>
        </aside>
      </header>

      <div className="writing-metric-strip" aria-live="polite">
        <div>
          <span>{t.words}</span>
          <strong>{analysis.words}</strong>
        </div>
        <div>
          <span>{t.characters}</span>
          <strong>{analysis.characters}</strong>
        </div>
        <div>
          <span>{t.letters}</span>
          <strong>{analysis.letters}</strong>
        </div>
        <div>
          <span>{t.readingTime}</span>
          <strong>{formatDuration(lang, analysis.words, 200, t.lessThanMinute, t.minutes)}</strong>
        </div>
      </div>

      <div className="writing-workspace">
        <section className="writing-editor">
          <div className="writing-editor-toolbar">
            <div>
              <strong>{t.editorTitle}</strong>
              <span role="status">{actionFeedback || t.editorHint}</span>
            </div>
            <div className="writing-editor-actions">
              <button type="button" onClick={handleCleanSpacing}>
                {t.cleanSpacing}
              </button>
              <button type="button" onClick={handleCopy}>
                {t.copyText}
              </button>
            </div>
          </div>

          <textarea
            className="writing-editor-textarea"
            value={text}
            aria-label={t.editorTitle}
            onChange={(event) => {
              setText(event.target.value);
              setActionFeedback('');
            }}
            placeholder={t.placeholder}
            spellCheck
          />

          <section className={`writing-limit-panel is-${limitState.tone}`} aria-live="polite">
            <div className="writing-limit-heading">
              <strong>{t.extensionTarget}</strong>
              <span>{replaceCount(t.currentCount, limitState.current)} · {limitLabel}</span>
            </div>
            <div className="writing-limit-controls">
              <label>
                <span>{t.unit}</span>
                <select value={limitUnit} onChange={(event) => setLimitUnit(event.target.value as LimitUnit)}>
                  <option value="words">{t.words}</option>
                  <option value="characters">{t.characters}</option>
                </select>
              </label>
              <label>
                <span>{t.minimum}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={minimum}
                  onChange={(event) => setMinimum(event.target.value)}
                />
              </label>
              <label>
                <span>{t.maximum}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={maximum}
                  placeholder={t.noLimit}
                  onChange={(event) => setMaximum(event.target.value)}
                />
              </label>
            </div>
            <div className="writing-limit-progress" aria-hidden="true">
              <span style={{ width: `${limitState.progress}%` }} />
            </div>
            <p>{limitState.message}</p>
          </section>
        </section>

        <aside className="writing-inspector">
          <section>
            <h4>{t.analysisTitle}</h4>
            <dl className="writing-detail-list">
              <div>
                <dt>{t.sentences}</dt>
                <dd>{analysis.sentences}</dd>
              </div>
              <div>
                <dt>{t.paragraphs}</dt>
                <dd>{analysis.paragraphs}</dd>
              </div>
              <div>
                <dt>{t.charactersNoSpaces}</dt>
                <dd>{analysis.charactersNoSpaces}</dd>
              </div>
              <div>
                <dt>{t.speakingTime}</dt>
                <dd>{formatDuration(lang, analysis.words, 130, t.lessThanMinute, t.minutes)}</dd>
              </div>
              <div>
                <dt>{t.averageSentence}</dt>
                <dd>{formatDecimal(lang, analysis.averageSentence)}</dd>
              </div>
              <div>
                <dt>{t.averageWord}</dt>
                <dd>{formatDecimal(lang, analysis.averageWord)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h4>{t.reviewTitle}</h4>
            {insights.length ? (
              <ul className="writing-insight-list">
                {insights.map((insight) => (
                  <li className={`is-${insight.tone}`} key={insight.text}>
                    {insight.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="writing-empty-state">{t.emptyReview}</p>
            )}
          </section>

          <section>
            <h4>{t.frequentTerms}</h4>
            {analysis.frequentTerms.length ? (
              <div className="writing-term-list">
                {analysis.frequentTerms.map((item) => (
                  <span key={item.term}>
                    {item.term} <strong>{item.count}</strong>
                  </span>
                ))}
              </div>
            ) : (
              <p className="writing-empty-state">{t.noFrequentTerms}</p>
            )}
          </section>
        </aside>
      </div>

      <section className="writing-long-sentences">
        <div>
          <h4>{t.longSentencesTitle}</h4>
          <span>{analysis.longSentences.length}</span>
        </div>
        {analysis.longSentences.length ? (
          <ol>
            {analysis.longSentences.slice(0, 5).map((item, index) => (
              <li key={`${item.sentence}-${index}`}>
                <p>{item.sentence}</p>
                <span>{replaceCount(t.longSentenceWords, item.words)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="writing-empty-state">{t.noLongSentences}</p>
        )}
      </section>
    </section>
  );
}
