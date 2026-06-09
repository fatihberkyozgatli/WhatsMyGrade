import React, { useEffect, useState } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Course, GradeComponent, GradeCalculationResult, GradeScale, DEFAULT_GRADE_SCALE } from '../types';
import { GradeCalculator } from '../components/GradeCalculator';
import { FormInput } from '../components/FormInputs';
import { ConfirmModal } from '../components/ConfirmModal';
import { EditScaleModal } from '../components/EditScaleModal';
import { ScenarioModal } from '../components/ScenarioModal';
import { XIcon, ArrowLeftIcon } from '../components/icons';
import { GradeCoach } from '../components/GradeCoach';
import { CourseDetailSkeleton } from '../components/Skeletons';
import { useToast } from '../ToastContext';

const buildScale = (t: { A: number; B: number; C: number; D: number }): GradeScale => ({
  A: { min: t.A, max: 100 },
  B: { min: t.B, max: Math.max(t.A - 0.01, t.B) },
  C: { min: t.C, max: Math.max(t.B - 0.01, t.C) },
  D: { min: t.D, max: Math.max(t.C - 0.01, t.D) },
  F: { min: 0, max: Math.max(t.D - 0.01, 0) },
});

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const toast = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [components, setComponents] = useState<GradeComponent[]>([]);
  const [calculation, setCalculation] = useState<GradeCalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialLoadError, setInitialLoadError] = useState('');
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type?: 'course' | 'component'; targetId?: number; targetName?: string }>({
    isOpen: false,
  });
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [scale, setScale] = useState<GradeScale | null>(null);
  const [scaleLoading, setScaleLoading] = useState(false);
  const [scaleSaving, setScaleSaving] = useState(false);
  const [scaleError, setScaleError] = useState('');
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [splitView, setSplitView] = useState(() => localStorage.getItem('wmg-course-layout') === 'split');
  const splitActive = splitView && !coachOpen;

  const [newComponent, setNewComponent] = useState({
    name: '',
    weight: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        if (!courseId) return;

        const courseRes = await api.get(`/courses/${courseId}`);
        if (cancelled) return;
        setCourse(courseRes.data);
        setInitialLoadError('');

        try {
          const componentsRes = await api.get(`/components/${courseId}`);
          if (!cancelled) setComponents(componentsRes.data);
        } catch (err) {
          console.error('Failed to load components:', err);
          if (!cancelled) setComponents([]);
        }

        try {
          const calcRes = await api.get(`/calculate/${courseId}`);
          if (!cancelled) setCalculation(calcRes.data);
        } catch (err) {
          console.error('Failed to load calculations:', err);
        }

        api
          .get(`/grade-scale/${courseId}`)
          .then((scaleRes) => {
            if (!cancelled) setScale(scaleRes.data);
          })
          .catch((err) => {
            console.error('Failed to load grading scale:', err);
          });
      } catch (err: any) {
        if (cancelled) return;
        setInitialLoadError(err.response?.data?.error || 'Failed to load course');
        console.error('Course fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    const handleLayoutToggle = (e: Event) => {
      setSplitView((e as CustomEvent<{ view: string }>).detail.view === 'split');
    };
    window.addEventListener('wmg-layout-toggle', handleLayoutToggle);
    return () => window.removeEventListener('wmg-layout-toggle', handleLayoutToggle);
  }, []);

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newComponent.name.trim()) {
      setError('Component name is required');
      return;
    }
    if (newComponent.weight <= 0) {
      setError('Weight must be greater than 0');
      return;
    }

    try {
      await api.post('/components', {
        courseId: parseInt(courseId!),
        ...newComponent,
      });

      const componentsRes = await api.get(`/components/${courseId}`);
      setComponents(componentsRes.data);

      const calcRes = await api.get(`/calculate/${courseId}`);
      setCalculation(calcRes.data);

      setNewComponent({ name: '', weight: 0 });
      setShowAddComponent(false);
      setError('');
      toast.success('Component added');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add component');
      console.error('Add component error:', err);
    }
  };

  const handleUpdateComponent = async (componentId: number, graded: boolean, grade: number | null) => {
    try {
      if (graded && grade !== null && (grade < 0 || grade > 100)) {
        setError('Grade must be between 0 and 100');
        return;
      }

      await api.put(`/components/${componentId}`, { graded, grade });

      const componentsRes = await api.get(`/components/${courseId}`);
      setComponents(componentsRes.data);

      const calcRes = await api.get(`/calculate/${courseId}`);
      setCalculation(calcRes.data);

      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update component');
      console.error('Component update error:', err);
    }
  };

  const handleDeleteComponent = (componentId: number, componentName: string) => {
    setDeleteModal({ isOpen: true, type: 'component', targetId: componentId, targetName: componentName });
  };

  const handleDeleteCourse = () => {
    if (!course) return;
    setDeleteModal({ isOpen: true, type: 'course', targetId: course.id, targetName: course.name });
  };

  const restoreComponent = async (comp: GradeComponent) => {
    try {
      await api.post('/components', {
        courseId: parseInt(courseId!),
        name: comp.name,
        weight: Number(comp.weight),
        graded: comp.graded,
        grade: comp.grade,
      });
      const componentsRes = await api.get(`/components/${courseId}`);
      setComponents(componentsRes.data);
      const calcRes = await api.get(`/calculate/${courseId}`);
      setCalculation(calcRes.data);
      toast.success('Component restored');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to restore component');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.targetId) return;

    try {
      setError('');

      if (deleteModal.type === 'course') {
        await api.delete(`/courses/${deleteModal.targetId}`);
        setDeleteModal({ isOpen: false });
        toast.destructive('Course deleted');
        navigate('/dashboard');
      } else if (deleteModal.type === 'component') {
        const deleted = components.find((c) => c.id === deleteModal.targetId);
        await api.delete(`/components/${deleteModal.targetId}`);

        try {
          const componentsRes = await api.get(`/components/${courseId}`);
          setComponents(componentsRes.data);
        } catch (err) {
          console.error('Failed to reload components:', err);
        }

        try {
          const calcRes = await api.get(`/calculate/${courseId}`);
          setCalculation(calcRes.data);
        } catch (err) {
          console.error('Failed to reload calculations:', err);
        }

        setDeleteModal({ isOpen: false });
        if (deleted) {
          toast.destructive('Component deleted', {
            action: { label: 'Undo', onClick: () => restoreComponent(deleted) },
          });
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete');
      setDeleteModal({ isOpen: false });
    }
  };

  const openScaleEditor = async () => {
    if (!courseId) return;
    setScaleModalOpen(true);
    setScaleError('');
    setScaleLoading(true);
    try {
      const res = await api.get(`/grade-scale/${courseId}`);
      setScale(res.data);
    } catch (err) {
      console.error('Failed to load grading scale:', err);
      setScaleError('Could not load the saved scale; showing defaults.');
      setScale(DEFAULT_GRADE_SCALE);
    } finally {
      setScaleLoading(false);
    }
  };

  const closeScaleEditor = () => {
    setScaleModalOpen(false);
    setScaleError('');
  };

  const handleSaveScale = async (thresholds: { A: number; B: number; C: number; D: number }) => {
    if (!courseId) return;
    setScaleSaving(true);
    setScaleError('');
    try {
      const res = await api.put(`/grade-scale/${courseId}`, buildScale(thresholds));
      setScale(res.data);

      try {
        const calcRes = await api.get(`/calculate/${courseId}`);
        setCalculation(calcRes.data);
      } catch (err) {
        console.error('Failed to reload calculations:', err);
      }

      setScaleModalOpen(false);
      toast.success('Grading scale updated');
    } catch (err: any) {
      setScaleError(err.response?.data?.error || 'Failed to save grading scale');
    } finally {
      setScaleSaving(false);
    }
  };

  if (loading) {
    return <CourseDetailSkeleton />;
  }

  if (initialLoadError || !course) {
    return (
      <div className="page-container">
        <div className="content-wrapper max-w-2xl">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mb-6 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="card text-center py-12">
            <p role="alert" className="text-red-700 dark:text-red-400 mb-4">{initialLoadError || 'Course not found'}</p>
            <Link to="/dashboard" className="btn-primary text-sm inline-block">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div
        className={`content-wrapper max-w-4xl transition-[padding-right] duration-300 ease-out ${
          coachOpen ? 'lg:pr-[476px]' : ''
        }`}
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mb-6 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
        </Link>

        {error && (
          <div role="alert" className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-950 dark:border-red-900 dark:text-red-300">
            {error}
          </div>
        )}

        {course && (
          <LayoutGroup>
          <div className={`mb-8 flex gap-3 ${coachOpen ? 'flex-col' : 'flex-col sm:flex-row sm:items-start sm:justify-between'}`}>
            <motion.div layout="position" transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }} className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 truncate" title={course.name}>{course.name}</h1>
              {course.semester && <p className="text-sm text-gray-500 mt-2 dark:text-slate-400">{course.semester}</p>}
            </motion.div>
            <motion.div layout="position" transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }} className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <button
                onClick={() => setCoachOpen(o => !o)}
                aria-expanded={coachOpen}
                aria-controls="grade-coach-drawer"
                className={`text-sm flex items-center justify-center gap-1.5 col-span-2 ${coachOpen ? 'btn-secondary' : 'btn-primary'}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
                  <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
                </svg>
                Grade Coach
              </button>
              {components.length > 0 && (
                <button onClick={() => setScenarioOpen(true)} className="btn-secondary text-sm">
                  Run Scenario
                </button>
              )}
              <button onClick={openScaleEditor} className="btn-secondary text-sm">
                Edit Grading Scale
              </button>
              <button onClick={handleDeleteCourse} className="btn-danger text-sm col-span-2">
                Delete Course
              </button>
            </motion.div>
          </div>
          </LayoutGroup>
        )}

        <motion.div 
          layout={reduce ? false : 'position'}
          layoutId="course-layout-container"
          transition={{ type: "spring", stiffness: 350, damping: 40, mass: 1 }}
          className={splitActive ? 'lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start' : ''}
        >
          {calculation && (
            <motion.div 
              layout={reduce ? false : 'position'}
              layoutId="calculator-section"
              transition={{ type: "spring", stiffness: 350, damping: 40, mass: 1 }}
              className={splitActive ? 'mb-8 lg:mb-0 lg:sticky lg:top-6' : 'mb-8'}
            >
              <GradeCalculator result={calculation} compact={splitActive} scale={scale ?? undefined} />
            </motion.div>
          )}

          <motion.div 
            layout={reduce ? false : 'position'}
            layoutId="components-section"
            transition={{ type: "spring", stiffness: 350, damping: 40, mass: 1 }}
            className="card"
          >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Grade Components</h2>
            <button
              onClick={() => setShowAddComponent(!showAddComponent)}
              className={showAddComponent ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
            >
              {showAddComponent ? 'Cancel' : 'Add Component'}
            </button>
          </div>

          {showAddComponent && (
            <form onSubmit={handleAddComponent} noValidate className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-slate-700/40 dark:border-slate-700">
              <FormInput
                label="Component Name"
                value={newComponent.name}
                onChange={(value) => setNewComponent({ ...newComponent, name: String(value) })}
                required
                placeholder="e.g., Midterm Exam"
              />

              <FormInput
                label="Weight (%)"
                type="number"
                value={newComponent.weight}
                onChange={(value) => setNewComponent({ ...newComponent, weight: Number(value) })}
                required
              />

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1 text-sm"
                >
                  Add Component
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddComponent(false)}
                  className="btn-secondary flex-1 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {components.length === 0 ? (
            <p className="text-center py-8 text-gray-500 dark:text-slate-400">No components added yet. Add one to start tracking.</p>
          ) : (
            <div className="space-y-2">
              {components.map((comp) => (
                <div key={comp.id} className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition dark:border-slate-700 dark:hover:bg-slate-700/40 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                  <div className="min-w-0 sm:flex-1">
                    <div className="font-medium text-gray-900 dark:text-slate-100 truncate" title={comp.name}>{comp.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 dark:text-slate-400">Weight: {Number(comp.weight)}%</div>
                  </div>

                  <div className="flex items-center gap-2 w-full justify-between sm:w-auto sm:justify-normal shrink-0">
                    <div className="flex items-center gap-2">
                    {comp.graded && comp.grade !== null ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          inputMode="decimal"
                          key={comp.grade}
                          defaultValue={comp.grade}
                          aria-label={`Grade for ${comp.name}`}
                          onBlur={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              handleUpdateComponent(comp.id, false, null);
                              return;
                            }
                            const parsed = parseFloat(raw);
                            if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
                              e.target.value = String(comp.grade);
                              setError('Grade must be between 0 and 100');
                              return;
                            }
                            handleUpdateComponent(comp.id, true, parsed);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-20 min-h-[44px] sm:min-h-0 px-2.5 py-1.5 border border-gray-300 rounded text-base sm:text-sm font-semibold text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-blue-400"
                        />
                        <span className="text-xs text-gray-500 dark:text-slate-400">%</span>
                      </>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        inputMode="decimal"
                        placeholder="Score"
                        aria-label={`Enter grade for ${comp.name}`}
                        onBlur={(e) => {
                          const raw = e.target.value;
                          if (!raw) return;
                          const parsed = parseFloat(raw);
                          if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
                            e.target.value = '';
                            setError('Grade must be between 0 and 100');
                            return;
                          }
                          handleUpdateComponent(comp.id, true, parsed);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          const raw = e.currentTarget.value;
                          if (!raw) return;
                          const parsed = parseFloat(raw);
                          if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
                            setError('Grade must be between 0 and 100');
                            return;
                          }
                          handleUpdateComponent(comp.id, true, parsed);
                          e.currentTarget.value = '';
                        }}
                        className="w-20 min-h-[44px] sm:min-h-0 px-2.5 py-1.5 border border-gray-300 rounded text-base sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500"
                      />
                    )}
                    </div>

                    <div className="flex items-center gap-2">
                      {comp.graded && comp.grade !== null && (
                        <button
                          onClick={() => handleUpdateComponent(comp.id, false, null)}
                          className="shrink-0 inline-flex items-center justify-center min-h-[44px] sm:min-h-0 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-950 dark:hover:bg-blue-900 text-xs font-medium px-2.5 py-1 rounded transition"
                          title="Mark as ungraded"
                          aria-label={`Mark ${comp.name} as ungraded`}
                        >
                          Clear
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteComponent(comp.id, comp.name)}
                        aria-label={`Delete ${comp.name}`}
                        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.type === 'course' ? 'Delete Course' : 'Delete Component'}
        message={
          deleteModal.type === 'course'
            ? `Are you sure you want to delete "${deleteModal.targetName}"? This cannot be undone.`
            : `Are you sure you want to delete "${deleteModal.targetName}"?`
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false })}
      />

      <EditScaleModal
        isOpen={scaleModalOpen}
        scale={scale}
        loading={scaleLoading}
        saving={scaleSaving}
        error={scaleError}
        onSave={handleSaveScale}
        onCancel={closeScaleEditor}
      />

      <ScenarioModal
        isOpen={scenarioOpen}
        onClose={() => setScenarioOpen(false)}
        courseId={courseId!}
        components={components}
      />

      <GradeCoach
        isOpen={coachOpen}
        onClose={() => setCoachOpen(false)}
        courseId={courseId!}
        course={course}
        calculation={calculation}
      />
    </div>
  );
};
