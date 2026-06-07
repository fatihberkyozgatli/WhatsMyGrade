import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { FormInput } from '../components/FormInputs';
import { ArrowLeftIcon, XIcon } from '../components/icons';

type Phase = 'upload' | 'review';

type ComponentDraft = { name: string; weight: number | '' };
type ScaleDraft = { A: number | ''; B: number | ''; C: number | ''; D: number | '' };

export const UploadSyllabusPage: React.FC = () => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [scaleProvided, setScaleProvided] = useState(true);

  const [form, setForm] = useState({ name: '', semester: '' });
  const [components, setComponents] = useState<ComponentDraft[]>([]);
  const [scale, setScale] = useState<ScaleDraft>({ A: 90, B: 80, C: 70, D: 60 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setFile(e.target.files?.[0] ?? null);
  };

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a PDF file first');
      return;
    }
    setParsing(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/courses/parse-syllabus', fd);
      const draft = res.data;

      setForm({
        name: draft.course?.name ?? '',
        semester: draft.course?.semester ?? '',
      });
      setComponents(
        (draft.components ?? []).map((c: { name?: string; weight?: number }) => ({
          name: c.name ?? '',
          weight: typeof c.weight === 'number' ? c.weight : '',
        }))
      );
      if (draft.gradingScale) {
        setScale({
          A: draft.gradingScale.A,
          B: draft.gradingScale.B,
          C: draft.gradingScale.C,
          D: draft.gradingScale.D,
        });
      }
      setScaleProvided(!!draft.gradingScale);
      setWarnings(Array.isArray(draft.warnings) ? draft.warnings : []);
      setPhase('review');
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          'Failed to read the syllabus. Try again, or go back and enter the course manually.'
      );
    } finally {
      setParsing(false);
    }
  };

  const updateComponent = (i: number, field: keyof ComponentDraft, value: string) => {
    setComponents((prev) =>
      prev.map((c, idx) =>
        idx === i
          ? { ...c, [field]: field === 'weight' ? (value === '' ? '' : Number(value)) : value }
          : c
      )
    );
  };
  const addComponent = () => setComponents((prev) => [...prev, { name: '', weight: '' }]);
  const removeComponent = (i: number) => setComponents((prev) => prev.filter((_, idx) => idx !== i));

  const weightSum = components.reduce((s, c) => s + (typeof c.weight === 'number' ? c.weight : 0), 0);
  const weightOff = components.length > 0 && Math.abs(weightSum - 100) > 0.01;

  const claimsMissing = (w: string) =>
    /(not (provided|specified|given|listed|available|included|present|found)|missing|absent|unavailable|n\/?a|could not be|unable to)/i.test(w);
  const reviewWarnings = [
    ...(components.length === 0 ? ['No graded components found. Add them below.'] : []),
    ...(!scaleProvided ? ['No grading scale found. Using the default 90/80/70/60.'] : []),
    ...warnings.filter((w) => !claimsMissing(w)),
  ];

  const handleAccept = async () => {
    setError('');
    if (!form.name.trim()) return setError('Course name is required');
    if (!form.semester.trim()) return setError('Semester is required');

    for (const c of components) {
      if (!c.name.trim()) return setError('Every component needs a name');
      if (c.weight === '' || Number(c.weight) <= 0) {
        return setError(`Weight for "${c.name || 'a component'}" must be greater than 0`);
      }
    }

    const { A, B, C, D } = scale;
    if (A === '' || B === '' || C === '' || D === '') {
      return setError('All grading scale thresholds are required');
    }
    if (A > 100 || A <= B || B <= C || C <= D || D <= 0) {
      return setError('Grading scale must descend within 0–100: 100 ≥ A > B > C > D > 0');
    }

    setSaving(true);
    try {
      const res = await api.post('/courses/from-draft', {
        name: form.name.trim(),
        semester: form.semester.trim(),
        components: components.map((c) => ({ name: c.name.trim(), weight: Number(c.weight) })),
        gradingScale: { A: Number(A), B: Number(B), C: Number(C), D: Number(D) },
      });
      navigate(`/course/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create the course');
    } finally {
      setSaving(false);
    }
  };

  const startOver = () => {
    setPhase('upload');
    setFile(null);
    setWarnings([]);
    setError('');
  };

  return (
    <div className="page-container">
      <div className="content-wrapper max-w-2xl">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mb-6 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
        </Link>

        {error && (
          <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-950 dark:border-red-900 dark:text-red-300">
            {error}
          </div>
        )}

        {phase === 'upload' && (
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">Upload Syllabus</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
              We'll read the PDF with AI and pull out the course name, components, and grading scale — you
              review and edit everything before it's saved.
            </p>

            <form onSubmit={handleParse} noValidate>
              <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition focus-within:ring-2 focus-within:ring-blue-500">
                <input type="file" accept="application/pdf,.pdf" onChange={handleFileChange} className="sr-only" />
                <svg className="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {file ? file.name : 'Click to choose a PDF syllabus'}
                </span>
                <span className="text-xs text-gray-400 dark:text-slate-500">PDF only, up to 10 MB</span>
              </label>

              <button type="submit" disabled={!file || parsing} className="btn-primary w-full mt-6">
                {parsing ? 'Reading your syllabus…' : 'Parse Syllabus'}
              </button>
              {parsing && (
                <div className="mt-4 flex items-center justify-center gap-2" role="status">
                  <div className="animate-spin motion-reduce:animate-none rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">This can take a few seconds…</span>
                </div>
              )}
            </form>
          </div>
        )}

        {phase === 'review' && (
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">Review &amp; Confirm</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-5">
              Check what we found and fix anything before creating the course.
            </p>

            {reviewWarnings.length > 0 && (
              <div role="status" className="mb-5 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-300">
                <p className="font-medium mb-1">A few things to double-check:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {reviewWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <FormInput
              label="Course Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: String(v) })}
              required
            />
            <FormInput
              label="Semester"
              value={form.semester}
              onChange={(v) => setForm({ ...form, semester: String(v) })}
              required
            />

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Grade Components</h2>
                <span className={`text-xs font-medium tabular-nums ${weightOff ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-500 dark:text-slate-400'}`}>
                  Total: {Math.round(weightSum * 100) / 100}% {weightOff && '(expected 100%)'}
                </span>
              </div>

              <div className="space-y-2">
                {components.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => updateComponent(i, 'name', e.target.value)}
                      placeholder="Component name"
                      aria-label={`Component ${i + 1} name`}
                      className="input-field flex-1"
                    />
                    <div className="relative w-24 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={c.weight}
                        onChange={(e) => updateComponent(i, 'weight', e.target.value)}
                        placeholder="0"
                        aria-label={`Component ${i + 1} weight`}
                        className="input-field pr-7"
                      />
                      <span className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 dark:text-slate-500 text-sm">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeComponent(i)}
                      aria-label={`Remove ${c.name || 'component'}`}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {components.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-slate-400 py-1">No components yet. Use Add component below.</p>
                )}
              </div>

              <button type="button" onClick={addComponent} className="btn-secondary text-sm mt-3">
                + Add component
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-1">Grading Scale</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Minimum percentage for each letter grade</p>
              <div className="grid grid-cols-2 gap-4">
                {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                  <FormInput
                    key={letter}
                    label={`${letter} (minimum %)`}
                    type="number"
                    value={scale[letter]}
                    onChange={(v) => setScale((s) => ({ ...s, [letter]: v as number | '' }))}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={handleAccept} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Creating…' : 'Create Course'}
              </button>
              <button type="button" onClick={startOver} disabled={saving} className="btn-secondary flex-1">
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
