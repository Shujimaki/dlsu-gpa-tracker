import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, TrashIcon, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface GradeItem {
  id: string;
  name: string;
  score: number;
  maxScore: number;
}

interface GradeCategory {
  id: string;
  name: string;
  weight: number;
  items: GradeItem[];
}

interface Subject {
  id: string;
  name: string;
  passingGrade: number;
  categories: GradeCategory[];
}

interface GradeCalculatorProps {
  user?: FirebaseUser | null;
  authInitialized?: boolean;
}

const PASSING_GRADE_PRESETS = [50, 55, 60, 65, 70];

const TRANSMUTATION_TABLES = {
  50: [
    { range: [95, 100], grade: 4.0 },
    { range: [90, 94.99], grade: 3.5 },
    { range: [82, 89.99], grade: 3.0 },
    { range: [75, 81.99], grade: 2.5 },
    { range: [66, 74.99], grade: 2.0 },
    { range: [58, 65.99], grade: 1.5 },
    { range: [50, 57.99], grade: 1.0 },
    { range: [0, 49.99], grade: 0.0 }
  ],
  55: [
    { range: [95, 100], grade: 4.0 },
    { range: [90, 94.99], grade: 3.5 },
    { range: [83, 89.99], grade: 3.0 },
    { range: [76, 82.99], grade: 2.5 },
    { range: [69, 75.99], grade: 2.0 },
    { range: [62, 68.99], grade: 1.5 },
    { range: [55, 61.99], grade: 1.0 },
    { range: [0, 54.99], grade: 0.0 }
  ],
  60: [
    { range: [95, 100], grade: 4.0 },
    { range: [90, 94.99], grade: 3.5 },
    { range: [84, 89.99], grade: 3.0 },
    { range: [78, 83.99], grade: 2.5 },
    { range: [72, 77.99], grade: 2.0 },
    { range: [66, 71.99], grade: 1.5 },
    { range: [60, 65.99], grade: 1.0 },
    { range: [0, 59.99], grade: 0.0 }
  ],
  65: [
    { range: [95, 100], grade: 4.0 },
    { range: [90, 94.99], grade: 3.5 },
    { range: [85, 89.99], grade: 3.0 },
    { range: [80, 84.99], grade: 2.5 },
    { range: [75, 79.99], grade: 2.0 },
    { range: [70, 74.99], grade: 1.5 },
    { range: [65, 69.99], grade: 1.0 },
    { range: [0, 64.99], grade: 0.0 }
  ],
  70: [
    { range: [96, 100], grade: 4.0 },
    { range: [92, 95.99], grade: 3.5 },
    { range: [88, 91.99], grade: 3.0 },
    { range: [83, 87.99], grade: 2.5 },
    { range: [78, 82.99], grade: 2.0 },
    { range: [74, 77.99], grade: 1.5 },
    { range: [70, 73.99], grade: 1.0 },
    { range: [0, 69.99], grade: 0.0 }
  ]
};

function categoryScore(items: GradeItem[]): number {
  if (items.length === 0) return 0;
  const totalPoints = items.reduce((sum, i) => sum + i.score, 0);
  const totalMax = items.reduce((sum, i) => sum + i.maxScore, 0);
  return totalMax > 0 ? (totalPoints / totalMax) * 100 : 0;
}

function migrateCategory(raw: GradeCategory & { score?: number }): GradeCategory {
  return {
    id: raw.id,
    name: raw.name,
    weight: raw.weight,
    items: Array.isArray(raw.items) ? raw.items : []
  };
}

const GradeCalculator = ({ user, authInitialized = false }: GradeCalculatorProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: crypto.randomUUID(), name: 'Subject 1', passingGrade: 60, categories: [] }
  ]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadAndMigrateData = async () => {
      if (!authInitialized) return;
      setIsLoading(true);

      let anonymousData = null;
      const anonymousDataString = sessionStorage.getItem('grade_calculator_data');
      if (anonymousDataString) {
        try { anonymousData = JSON.parse(anonymousDataString); }
        catch (e) { console.error("Error parsing anonymous grade_calculator_data", e); }
      }

      const newLoginSession = sessionStorage.getItem('newLogin') === 'true';

      if (user) {
        if (newLoginSession) sessionStorage.removeItem('newLogin');

        let firestoreSubjects: Subject[] = [];
        let firestoreActiveSubjectId: string | null = null;
        let firestoreDocExists = false;

        try {
          const userRef = doc(db, 'users', user.uid);
          const gradeCalcRef = doc(userRef, 'settings', 'gradeCalculator');
          const firestoreDoc = await getDoc(gradeCalcRef);

          if (firestoreDoc.exists()) {
            firestoreDocExists = true;
            const data = firestoreDoc.data();
            if (data.subjects && Array.isArray(data.subjects)) {
              firestoreSubjects = data.subjects.map((s: Subject) => ({
                ...s,
                categories: (s.categories || []).map(migrateCategory)
              }));
            }
            if (data.activeSubjectId) {
              const exists = firestoreSubjects.some((s: Subject) => s.id === data.activeSubjectId);
              firestoreActiveSubjectId = exists ? data.activeSubjectId : (firestoreSubjects.length > 0 ? firestoreSubjects[0].id : null);
            } else if (firestoreSubjects.length > 0) {
              firestoreActiveSubjectId = firestoreSubjects[0].id;
            }
          }
        } catch (error) {
          console.error("GradeCalc: Error loading Firestore data:", error);
        }

        const firestoreEmpty = firestoreSubjects.length === 0;
        const anonHasData = anonymousData?.subjects?.length > 0;

        if (firestoreEmpty && anonHasData) {
          const toMigrate = anonymousData.subjects.slice(0, 8).map((s: Subject) => ({
            ...s,
            categories: (s.categories || []).map(migrateCategory)
          }));
          setSubjects(toMigrate);
          const activeMigrated = toMigrate.some((s: Subject) => s.id === anonymousData.activeSubjectId);
          const newActive = activeMigrated ? anonymousData.activeSubjectId : (toMigrate.length > 0 ? toMigrate[0].id : null);
          setActiveSubjectId(newActive);
          try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(doc(userRef, 'settings', 'gradeCalculator'), { subjects: toMigrate, activeSubjectId: newActive }, { merge: true });
            sessionStorage.removeItem('grade_calculator_data');
          } catch (e) { console.error("GradeCalc: Migration save error:", e); }
          setIsLoading(false);
          return;
        }

        if (firestoreDocExists && firestoreSubjects.length > 0) {
          setSubjects(firestoreSubjects);
          setActiveSubjectId(firestoreActiveSubjectId);
        } else {
          const def = { id: crypto.randomUUID(), name: 'Subject 1', passingGrade: 60, categories: [] };
          setSubjects([def]);
          setActiveSubjectId(def.id);
          if (newLoginSession && !firestoreDocExists) {
            try {
              const userRef = doc(db, 'users', user.uid);
              await setDoc(doc(userRef, 'settings', 'gradeCalculator'), { subjects: [def], activeSubjectId: def.id }, { merge: true });
            } catch (e) { console.error("GradeCalc: Default save error:", e); }
          }
        }
      } else if (!user && authInitialized) {
        if (anonymousData?.subjects && Array.isArray(anonymousData.subjects)) {
          const migrated = anonymousData.subjects.map((s: Subject) => ({
            ...s,
            categories: (s.categories || []).map(migrateCategory)
          }));
          setSubjects(migrated);
          const exists = migrated.some((s: Subject) => s.id === anonymousData.activeSubjectId);
          setActiveSubjectId(exists ? anonymousData.activeSubjectId : (migrated.length > 0 ? migrated[0].id : null));
        } else {
          const def = { id: crypto.randomUUID(), name: 'Subject 1', passingGrade: 60, categories: [] };
          setSubjects([def]);
          setActiveSubjectId(def.id);
        }
      }
      setIsLoading(false);
    };

    if (authInitialized) loadAndMigrateData();
  }, [user, authInitialized]);

  useEffect(() => {
    const saveData = async () => {
      if (isLoading) return;
      setSaveStatus('Saving...');
      if (user && authInitialized) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(doc(userRef, 'settings', 'gradeCalculator'), { subjects, activeSubjectId }, { merge: true });
          setSaveStatus('Settings saved');
          setTimeout(() => setSaveStatus(null), 2000);
        } catch { setSaveStatus('Error saving'); setTimeout(() => setSaveStatus(null), 2000); }
      } else {
        try {
          sessionStorage.setItem('grade_calculator_data', JSON.stringify({ subjects, activeSubjectId }));
          setSaveStatus('Settings saved');
          setTimeout(() => setSaveStatus(null), 2000);
        } catch { setSaveStatus('Error saving'); setTimeout(() => setSaveStatus(null), 2000); }
      }
    };
    const id = setTimeout(saveData, 1000);
    return () => clearTimeout(id);
  }, [subjects, activeSubjectId, user, authInitialized, isLoading]);

  useEffect(() => {
    if (subjects.length > 0 && !activeSubjectId) setActiveSubjectId(subjects[0].id);
  }, [subjects, activeSubjectId]);

  useEffect(() => {
    if (authInitialized && !user) {
      sessionStorage.removeItem('grade_calculator_data');
      const def = { id: crypto.randomUUID(), name: 'Subject 1', passingGrade: 60, categories: [] };
      setSubjects([def]);
      setActiveSubjectId(null);
    }
  }, [user, authInitialized]);

  useEffect(() => {
    return () => { if (!user) sessionStorage.removeItem('anonymousSession'); };
  }, [user]);

  const activeSubject = useMemo(() =>
    subjects.find(s => s.id === activeSubjectId) || null,
    [subjects, activeSubjectId]
  );

  const { totalWeight, finalGrade } = useMemo(() => {
    if (!activeSubject) return { totalWeight: 0, finalGrade: 0 };
    let totalWeight = 0;
    let weightedScore = 0;
    activeSubject.categories.forEach(cat => {
      totalWeight += cat.weight;
      weightedScore += (categoryScore(cat.items) / 100) * cat.weight;
    });
    return { totalWeight, finalGrade: totalWeight > 0 ? weightedScore : 0 };
  }, [activeSubject]);

  const transmutationTable = useMemo(() => {
    if (!activeSubject) return [];
    const pg = activeSubject.passingGrade;
    const closest = PASSING_GRADE_PRESETS.reduce((a, b) => Math.abs(b - pg) < Math.abs(a - pg) ? b : a);
    return TRANSMUTATION_TABLES[closest as keyof typeof TRANSMUTATION_TABLES];
  }, [activeSubject]);

  const transmutedGrade = useMemo(() => {
    if (!activeSubject || transmutationTable.length === 0) return 0;
    const entry = transmutationTable.find(e => finalGrade >= e.range[0] && finalGrade <= e.range[1]);
    return entry ? entry.grade : 0;
  }, [activeSubject, finalGrade, transmutationTable]);

  const updateSubjects = (updater: (prev: Subject[]) => Subject[]) => setSubjects(updater);

  const addSubject = () => {
    if (subjects.length >= 8) { alert("Maximum of 8 subjects allowed"); return; }
    const s: Subject = { id: crypto.randomUUID(), name: 'New Subject', passingGrade: 60, categories: [] };
    setSubjects(prev => [...prev, s]);
    setActiveSubjectId(s.id);
  };

  const removeSubject = (id: string) => {
    const updated = subjects.filter(s => s.id !== id);
    setSubjects(updated);
    if (activeSubjectId === id) setActiveSubjectId(updated.length > 0 ? updated[0].id : null);
  };

  const updateSubjectName = (id: string, name: string) =>
    updateSubjects(prev => prev.map(s => s.id === id ? { ...s, name: name.slice(0, 30) } : s));

  const updatePassingGrade = (id: string, pg: number) => {
    const closest = PASSING_GRADE_PRESETS.reduce((a, b) => Math.abs(b - pg) < Math.abs(a - pg) ? b : a);
    updateSubjects(prev => prev.map(s => s.id === id ? { ...s, passingGrade: closest } : s));
  };

  const addCategory = () => {
    if (!activeSubject) return;
    if (activeSubject.categories.length >= 8) { alert("Maximum of 8 categories allowed per subject."); return; }
    const cat: GradeCategory = { id: crypto.randomUUID(), name: '', weight: 0, items: [] };
    updateSubjects(prev => prev.map(s =>
      s.id === activeSubject.id ? { ...s, categories: [...s.categories, cat] } : s
    ));
    setExpandedCategories(prev => new Set([...prev, cat.id]));
  };

  const removeCategory = (categoryId: string) => {
    if (!activeSubject) return;
    updateSubjects(prev => prev.map(s =>
      s.id === activeSubject.id
        ? { ...s, categories: s.categories.filter(c => c.id !== categoryId) }
        : s
    ));
  };

  const updateCategoryWeight = (categoryId: string, value: number) => {
    if (!activeSubject) return;
    const otherTotal = activeSubject.categories.reduce((sum, c) =>
      c.id === categoryId ? sum : sum + c.weight, 0);
    if (otherTotal + value > 100) {
      alert(`Total weight cannot exceed 100%. Max for this category: ${100 - otherTotal}%`);
      return;
    }
    updateSubjects(prev => prev.map(s =>
      s.id === activeSubject.id
        ? { ...s, categories: s.categories.map(c => c.id === categoryId ? { ...c, weight: value } : c) }
        : s
    ));
  };

  const updateCategoryName = (categoryId: string, name: string) => {
    if (!activeSubject) return;
    updateSubjects(prev => prev.map(s =>
      s.id === activeSubject.id
        ? { ...s, categories: s.categories.map(c => c.id === categoryId ? { ...c, name } : c) }
        : s
    ));
  };

  const addItem = (categoryId: string) => {
    if (!activeSubject) return;
    const cat = activeSubject.categories.find(c => c.id === categoryId);
    if (!cat) return;
    if (cat.items.length >= 20) { alert("Maximum of 20 items per category."); return; }
    const item: GradeItem = { id: crypto.randomUUID(), name: '', score: 0, maxScore: 100 };
    updateSubjects(prev => prev.map(s =>
      s.id === activeSubject.id
        ? { ...s, categories: s.categories.map(c => c.id === categoryId ? { ...c, items: [...c.items, item] } : c) }
        : s
    ));
  };

  const removeItem = (categoryId: string, itemId: string) => {
    if (!activeSubject) return;
    updateSubjects(prev => prev.map(s =>
      s.id === activeSubject.id
        ? { ...s, categories: s.categories.map(c => c.id === categoryId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c) }
        : s
    ));
  };

  const updateItemName = (categoryId: string, itemId: string, name: string) => {
    if (!activeSubject) return;
    updateSubjects(prev => prev.map(s =>
      s.id === activeSubject.id
        ? { ...s, categories: s.categories.map(c => c.id === categoryId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, name } : i) } : c) }
        : s
    ));
  };

  const updateItemScore = (categoryId: string, itemId: string, score: number) => {
    if (!activeSubject) return;
    const cat = activeSubject.categories.find(c => c.id === categoryId);
    const item = cat?.items.find(i => i.id === itemId);
    if (!item) return;
    if (score < 0 || score > item.maxScore) {
      alert(`Score must be between 0 and ${item.maxScore}.`);
      return;
    }
    updateSubjects(prev => prev.map(s =>
      s.id === activeSubject.id
        ? { ...s, categories: s.categories.map(c => c.id === categoryId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, score } : i) } : c) }
        : s
    ));
  };

  const updateItemMaxScore = (categoryId: string, itemId: string, maxScore: number) => {
    if (!activeSubject) return;
    if (maxScore <= 0) { alert("Max score must be greater than 0."); return; }
    const cat = activeSubject.categories.find(c => c.id === categoryId);
    const item = cat?.items.find(i => i.id === itemId);
    if (!item) return;
    const clampedScore = Math.min(item.score, maxScore);
    updateSubjects(prev => prev.map(s =>
      s.id === activeSubject.id
        ? { ...s, categories: s.categories.map(c => c.id === categoryId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, maxScore, score: clampedScore } : i) } : c) }
        : s
    ));
  };

  const toggleCategory = (categoryId: string) =>
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });

  const setInput = (key: string, val: string) =>
    setInputValues(prev => ({ ...prev, [key]: val }));

  const clearInput = (key: string) =>
    setInputValues(prev => { const n = { ...prev }; delete n[key]; return n; });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-dlsu-green/20 border-t-dlsu-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-mount">
      {/* Header */}
      <div className="card">
        <div className="card-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="font-display font-semibold text-base text-dlsu-slate">Grade Calculator</h2>
          {saveStatus && <span className="text-xs text-dlsu-green font-medium">{saveStatus}</span>}
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-400">
            Calculate your subject grades using weighted categories and individual scored items.
          </p>
        </div>
      </div>

      {/* Subject Tabs */}
      <div className="card">
        <div className="overflow-x-auto border-b border-[#1E2B24] p-3 bg-[#0D1410] flex flex-row items-center gap-2 grade-calc-subject-tabs-container">
          {subjects.map(subject => {
            const isActive = activeSubjectId === subject.id;
            return (
              <button
                key={subject.id}
                onClick={() => setActiveSubjectId(subject.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center justify-between min-w-[150px] max-w-[170px] h-9 flex-shrink-0 text-sm transition-colors grade-calc-subject-button ${
                  isActive ? 'bg-dlsu-green text-white shadow-sm' : 'bg-[#111916] text-gray-300 hover:bg-white/5 border border-[#1E2B24]'
                }`}
              >
                <span className={`flex-grow truncate mr-1 ${isActive ? 'text-[#0A0F0D]' : ''}`} title={subject.name}>
                  {subject.name}
                </span>
                {subjects.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSubject(subject.id); }}
                    className={`p-0.5 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-gray-500 hover:bg-white/10 hover:text-gray-300'
                    }`}
                    aria-label="Remove subject"
                  >
                    <X size={14} />
                  </button>
                )}
              </button>
            );
          })}
          {subjects.length < 8 ? (
            <button onClick={addSubject} className="btn btn-sm text-gray-400 hover:text-dlsu-green border border-dashed border-[#2D3B33] hover:border-dlsu-green/40 gap-1 flex-shrink-0 transition-colors">
              <PlusCircle size={14} />
              Add Subject
            </button>
          ) : (
            <span className="px-3 py-1.5 text-xs text-gray-500 italic h-9 flex items-center flex-shrink-0">Max 8 subjects</span>
          )}
        </div>

        {activeSubject && (
          <div className="p-4 sm:p-5">
            <div className="flex flex-col md:flex-row gap-4 mb-5">
              <div className="flex-1">
                <label className="input-label">Subject Name</label>
                <input
                  type="text"
                  value={activeSubject.name}
                  onChange={(e) => updateSubjectName(activeSubject.id, e.target.value)}
                  className="input"
                  maxLength={30}
                />
              </div>
              <div className="w-full md:w-40">
                <label className="input-label">Passing Grade (%)</label>
                <select
                  value={activeSubject.passingGrade}
                  onChange={(e) => updatePassingGrade(activeSubject.id, Number(e.target.value))}
                  className="input"
                >
                  {PASSING_GRADE_PRESETS.map(p => (
                    <option key={p} value={p}>{p}%</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Minimum score to pass (1.0)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Categories + Items */}
              <div className="lg:col-span-2">
                <h3 className="font-display font-semibold text-sm text-dlsu-slate mb-3">Grade Computations</h3>

                <div className="space-y-2">
                  {activeSubject.categories.length === 0 ? (
                    <div className="rounded-lg border border-[#1E2B24] py-6 text-center text-sm text-gray-500 italic">
                      No categories added yet
                    </div>
                  ) : (
                    activeSubject.categories.map(cat => {
                      const expanded = expandedCategories.has(cat.id);
                      const score = categoryScore(cat.items);
                      const weighted = (score / 100) * cat.weight;
                      return (
                        <div key={cat.id} className="rounded-lg border border-[#1E2B24] overflow-hidden">
                          {/* Category row */}
                          <div className="flex items-center gap-2 px-3 py-2 bg-[#0D1410]">
                            <button
                              onClick={() => toggleCategory(cat.id)}
                              className="text-gray-500 hover:text-dlsu-green transition-colors flex-shrink-0"
                              aria-label={expanded ? 'Collapse' : 'Expand'}
                            >
                              {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </button>
                            <input
                              type="text"
                              value={cat.name}
                              onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                              placeholder="Category name"
                              className="input py-1 flex-1 min-w-0"
                            />
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <input
                                type="number"
                                value={inputValues[`${cat.id}_weight`] ?? String(cat.weight)}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  setInput(`${cat.id}_weight`, raw);
                                  if (raw === '' || raw === '.') return;
                                  const n = Number(raw);
                                  if (!isNaN(n)) updateCategoryWeight(cat.id, n);
                                }}
                                onBlur={() => clearInput(`${cat.id}_weight`)}
                                min="0"
                                max="100"
                                placeholder="0"
                                className="input py-1 text-center w-16"
                              />
                              <span className="text-xs text-gray-500 flex-shrink-0">%</span>
                            </div>
                            <div className="flex-shrink-0 text-right min-w-[90px]">
                              <span className={`text-xs font-medium ${score > 0 ? 'text-dlsu-green' : 'text-gray-500'}`}>
                                {score.toFixed(2)}%
                              </span>
                              <span className="text-gray-600 mx-1 text-xs">→</span>
                              <span className="text-xs font-medium text-dlsu-slate">
                                {weighted.toFixed(2)}
                              </span>
                            </div>
                            <button
                              onClick={() => removeCategory(cat.id)}
                              className="btn-icon p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors flex-shrink-0"
                              aria-label="Remove category"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>

                          {/* Items (expanded) */}
                          {expanded && (
                            <div className="border-t border-[#1E2B24]">
                              {cat.items.length === 0 ? (
                                <p className="px-8 py-3 text-xs text-gray-600 italic">No items yet — add one below</p>
                              ) : (
                                cat.items.map(item => {
                                  const pct = item.maxScore > 0 ? (item.score / item.maxScore) * 100 : 0;
                                  const scoreKey = `${cat.id}_${item.id}_score`;
                                  const maxKey = `${cat.id}_${item.id}_maxScore`;
                                  return (
                                    <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1A2420] last:border-b-0 bg-[#0A0F0C]">
                                      <div className="w-4 flex-shrink-0" />
                                      <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => updateItemName(cat.id, item.id, e.target.value)}
                                        placeholder="Item name"
                                        className="input py-1 flex-1 min-w-0 text-sm"
                                      />
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <input
                                          type="number"
                                          value={inputValues[scoreKey] ?? String(item.score)}
                                          onChange={(e) => {
                                            const raw = e.target.value;
                                            setInput(scoreKey, raw);
                                            if (raw === '' || raw === '.') return;
                                            const n = Number(raw);
                                            if (!isNaN(n)) updateItemScore(cat.id, item.id, n);
                                          }}
                                          onBlur={() => clearInput(scoreKey)}
                                          min="0"
                                          className="input py-1 text-center w-16 text-sm"
                                        />
                                        <span className="text-gray-600 text-xs">/</span>
                                        <input
                                          type="number"
                                          value={inputValues[maxKey] ?? String(item.maxScore)}
                                          onChange={(e) => {
                                            const raw = e.target.value;
                                            setInput(maxKey, raw);
                                            if (raw === '' || raw === '.') return;
                                            const n = Number(raw);
                                            if (!isNaN(n) && n > 0) updateItemMaxScore(cat.id, item.id, n);
                                          }}
                                          onBlur={() => clearInput(maxKey)}
                                          min="1"
                                          className="input py-1 text-center w-16 text-sm"
                                        />
                                      </div>
                                      <span className={`text-xs font-medium w-14 text-right flex-shrink-0 ${pct >= activeSubject.passingGrade ? 'text-dlsu-green' : 'text-gray-400'}`}>
                                        {pct.toFixed(1)}%
                                      </span>
                                      <button
                                        onClick={() => removeItem(cat.id, item.id)}
                                        className="btn-icon p-1 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors flex-shrink-0"
                                        aria-label="Remove item"
                                      >
                                        <TrashIcon size={13} />
                                      </button>
                                    </div>
                                  );
                                })
                              )}
                              <div className="px-8 py-2">
                                <button
                                  onClick={() => addItem(cat.id)}
                                  className="btn btn-sm text-gray-500 hover:text-dlsu-green border border-dashed border-[#2D3B33] hover:border-dlsu-green/40 gap-1 transition-colors text-xs"
                                >
                                  <PlusCircle size={12} />
                                  Add Item
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Totals row */}
                {activeSubject.categories.length > 0 && (
                  <div className="flex justify-between items-center px-3 py-2 mt-2 rounded-lg bg-[#0D1410] border border-[#1E2B24] text-sm">
                    <span className="text-gray-400 font-medium">Total Weight</span>
                    <span className="text-dlsu-slate font-semibold">{totalWeight.toFixed(2)}%</span>
                    <span className="text-gray-400 font-medium">Weighted Score</span>
                    <span className="text-dlsu-green font-semibold">{finalGrade.toFixed(2)}%</span>
                  </div>
                )}

                <button
                  onClick={addCategory}
                  className="btn btn-primary btn-sm gap-1 mt-3 grade-calc-button"
                >
                  <PlusCircle size={14} />
                  Add Category
                </button>
              </div>

              {/* Grade Transmutation */}
              <div className="lg:col-span-1">
                <h3 className="font-display font-semibold text-sm text-dlsu-slate mb-3">Grade Transmutation</h3>
                <div className="overflow-x-auto rounded-lg border border-[#1E2B24]">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Percentage Range</th>
                        <th className="text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transmutationTable.map((row, i) => (
                        <tr key={i} className={
                          finalGrade >= row.range[0] && finalGrade <= row.range[1]
                            ? '!bg-emerald-500/10 font-medium'
                            : ''
                        }>
                          <td className="text-xs">{row.range[0].toFixed(2)}% – {row.range[1].toFixed(2)}%</td>
                          <td className="text-center text-xs">{row.grade.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gradient-to-br from-[#0D1410] to-emerald-500/10 p-4 rounded-xl text-center mt-4 border border-[#1E2B24]">
                  <p className="stat-label mb-1">Final Grade</p>
                  <p className="stat-value text-dlsu-green">{transmutedGrade.toFixed(1)}</p>
                  <p className="text-sm text-gray-400 mt-1">Raw score: {finalGrade.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500 mt-2">{activeSubject.passingGrade}% is the minimum to pass (1.0)</p>
                  <p className="text-xs text-gray-500 mt-1 italic">Note: These grades are not final. Please refer to Archers Hub.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeCalculator;
