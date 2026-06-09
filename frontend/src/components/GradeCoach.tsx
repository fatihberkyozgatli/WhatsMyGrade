import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../api';
import { Course, GradeCalculationResult } from '../types';
import { XIcon, CheckIcon, AlertTriangleIcon, ListChecksIcon, TrendingUpIcon } from './icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  course: Course;
  calculation: GradeCalculationResult | null;
  onDataChanged?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  synthetic?: true;
}

const QUICK_PROMPTS = [
  'Can I still get an A?',
  'Add my components for me',
  'What if I score 80% on everything left?',
  'Which component matters most?',
];

function statusClasses(s: string) {
  if (s === 'Excellent') return { text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' };
  if (s === 'Good')      return { text: 'text-blue-600 dark:text-blue-400',    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400' };
  if (s === 'At Risk')   return { text: 'text-amber-600 dark:text-amber-400',  badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' };
  return                        { text: 'text-red-600 dark:text-red-400',      badge: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' };
}

interface Insight {
  key: string;
  label: string;
  value: string;
  Icon: React.FC<{ className?: string }>;
  tone: string;
}

const TONE = {
  good: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-900 dark:text-green-300',
  info: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300',
  warn: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-300',
  bad: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-300',
  neutral: 'bg-white border-gray-200 text-gray-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300',
};

const riskFromRequired = (required: number): Insight => {
  if (required <= 70) return { key: 'risk', label: 'Risk', value: 'Low', Icon: CheckIcon, tone: TONE.good };
  if (required <= 85) return { key: 'risk', label: 'Risk', value: 'Medium', Icon: AlertTriangleIcon, tone: TONE.warn };
  return { key: 'risk', label: 'Risk', value: 'High', Icon: AlertTriangleIcon, tone: TONE.bad };
};

const buildInsights = (calc: GradeCalculationResult): Insight[] => {
  const components = calc.components || [];
  if (components.length === 0) return [];
  const insights: Insight[] = [];

  const ungraded = components.filter((c) => !c.graded);
  if (ungraded.length > 0) {
    const biggest = ungraded.reduce((a, b) => (Number(b.weight) > Number(a.weight) ? b : a));
    insights.push({
      key: 'remaining',
      label: 'Biggest remaining',
      value: `${biggest.name} (${Number(biggest.weight)}%)`,
      Icon: ListChecksIcon,
      tone: TONE.neutral,
    });
  } else {
    insights.push({ key: 'remaining', label: 'Components', value: 'All graded', Icon: CheckIcon, tone: TONE.good });
  }

  const order = ['A', 'B', 'C', 'D'];
  const target = order.find((letter) => {
    const req = calc.requiredByLetterGrade?.[letter];
    return req && !Number.isNaN(parseFloat(req));
  });
  if (target) {
    insights.push({
      key: 'needed',
      label: `Needed for ${target}`,
      value: calc.requiredByLetterGrade[target],
      Icon: TrendingUpIcon,
      tone: TONE.info,
    });
    insights.push(riskFromRequired(parseFloat(calc.requiredByLetterGrade[target])));
  } else {
    const secured = order.find((letter) => calc.requiredByLetterGrade?.[letter] === 'Already secured');
    if (secured) {
      insights.push({ key: 'needed', label: 'Secured', value: `At least ${secured}`, Icon: CheckIcon, tone: TONE.good });
    }
  }

  return insights;
};

const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
  </svg>
);

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-500"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function renderContent(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

export const GradeCoach: React.FC<Props> = ({ isOpen, onClose, courseId, course, calculation, onDataChanged }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  const insights = useMemo(() => (calculation ? buildInsights(calculation) : []), [calculation]);

  const buildWelcome = (): Message => {
    const grade = calculation?.currentGrade;
    const remaining = calculation?.percentageRemaining ?? 0;
    return {
      id: 'welcome',
      role: 'assistant',
      synthetic: true,
      content:
        grade !== null && grade !== undefined
          ? `You've secured **${grade.toFixed(1)}%** so far with **${remaining}%** still on the table — what do you want to figure out?`
          : `No grades entered yet in **${course.name}**. Tell me your components and I can add them for you, or set them up yourself.`,
    };
  };

  const startNewChat = () => {
    setMessages([buildWelcome()]);
    setInput('');
    setError('');
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([buildWelcome()]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key === 'Tab') {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
          'button, textarea, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const list = Array.from(focusable).filter(el => !el.hasAttribute('disabled'));
        if (!list.length) return;
        const [first, last] = [list[0], list[list.length - 1]];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const resizeTextarea = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setError('');
    resizeTextarea(e.target);
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setError('');
    setLoading(true);
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }

    try {
      const history = messages
        .filter(m => !m.synthetic)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await api.post(`/coach/${courseId}`, { message: trimmed, history });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.reply,
      }]);
      if (res.data.dataChanged) onDataChanged?.();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const currentGrade = calculation?.currentGrade ?? null;
  const remaining = calculation?.percentageRemaining ?? 0;
  const status = calculation?.status ?? '';
  const sc = statusClasses(status);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Grade Coach"
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
            onAnimationComplete={() => inputRef.current?.focus()}
            className="fixed right-0 top-0 h-full lg:top-[var(--app-header-h,68px)] lg:bottom-0 lg:h-auto w-full max-w-[460px] z-50 flex flex-col bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 shadow-2xl focus:outline-none"
          >
            <div className="shrink-0 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center shadow-sm">
                    <SparkleIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-slate-100 leading-tight">
                      Grade Coach
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-tight truncate max-w-[240px]">
                      {course.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 1 && (
                    <button
                      type="button"
                      onClick={startNewChat}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      New chat
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    aria-label="Close Grade Coach"
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {calculation && (
                <div className="flex items-center gap-2 px-5 pb-4 flex-wrap">
                  {currentGrade !== null && (
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 rounded-full px-3 py-1">
                      <span className="text-xs text-gray-500 dark:text-slate-400">Current</span>
                      <span className={`text-sm font-semibold tabular-nums ${sc.text}`}>
                        {currentGrade.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {remaining > 0 && (
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 rounded-full px-3 py-1">
                      <span className="text-xs text-gray-500 dark:text-slate-400">Remaining</span>
                      <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 tabular-nums">
                        {remaining}%
                      </span>
                    </div>
                  )}
                  {status && status !== 'No components added' && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.badge}`}>
                      {status}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              aria-live="polite"
              aria-atomic="false"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <SparkleIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-tl-sm border border-gray-100 dark:border-slate-700'
                  }`}>
                    {renderContent(msg.content)}
                    {msg.synthetic && msg.id === 'welcome' && insights.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        {insights.map((chip) => (
                          <div
                            key={chip.key}
                            className={`flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${chip.tone}`}
                          >
                            <chip.Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>
                              <span className="font-semibold">{chip.label}:</span> {chip.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                    <SparkleIcon className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-tl-sm">
                    <TypingDots />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start justify-between gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
                  <span>{error}</span>
                  <button onClick={() => setError('')} aria-label="Dismiss error" className="shrink-0 hover:opacity-70 transition-opacity">
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {messages.length <= 1 && !loading && (
              <div className="shrink-0 border-t border-gray-100 dark:border-slate-800 px-4 pt-3 pb-2 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((label) => (
                  <button
                    key={label}
                    onClick={() => send(label)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="shrink-0 border-t border-gray-100 dark:border-slate-800 px-4 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKey}
                  placeholder="Ask about this course…"
                  rows={1}
                  disabled={loading}
                  className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-2.5 text-base sm:text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 leading-relaxed overflow-hidden"
                  style={{ maxHeight: '128px' }}
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className="shrink-0 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900 text-white flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 text-center">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
