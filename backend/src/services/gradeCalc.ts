import { GradeScale } from '../constants';

export interface GradeComponentInput {
  weight: number | string;
  graded: boolean;
  grade: number | string | null;
  name?: string;
  [key: string]: unknown;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const letterFor = (grade: number | null, scale: GradeScale): string => {
  if (grade === null) return 'N/A';
  const entries = Object.entries(scale).sort((a, b) => b[1].min - a[1].min);
  for (const [letter, range] of entries) {
    if (grade >= range.min) return letter;
  }
  return 'F';
};

export const computeResult = (components: GradeComponentInput[], scale: GradeScale) => {
  let totalWeightedGrade = 0;
  let totalGradedWeight = 0;
  let totalRemainingWeight = 0;

  components.forEach((comp) => {
    const weight = parseFloat(String(comp.weight));
    const grade = parseFloat(String(comp.grade));

    if (comp.graded && comp.grade !== null) {
      totalWeightedGrade += (grade * weight) / 100;
      totalGradedWeight += weight;
    } else {
      totalRemainingWeight += weight;
    }
  });

  const rawCurrentGrade = totalGradedWeight > 0 ? totalWeightedGrade / (totalGradedWeight / 100) : null;
  const currentGrade = rawCurrentGrade !== null ? Math.round(rawCurrentGrade * 100) / 100 : null;
  const percentageGraded = totalGradedWeight;
  const percentageRemaining = totalRemainingWeight;
  const totalWeight = percentageGraded + percentageRemaining;

  let projectedFinalGrade = null;
  if (totalRemainingWeight > 0 && currentGrade !== null) {
    projectedFinalGrade = (currentGrade * percentageGraded + 100 * totalRemainingWeight) / totalWeight;
  } else if (percentageRemaining === 0 && totalWeight > 0) {
    projectedFinalGrade = currentGrade;
  }

  const requiredByLetterGrade: { [key: string]: string } = {};

  Object.entries(scale).forEach(([letter, range]) => {
    const targetGrade = range.min;

    if (totalWeight === 0) {
      requiredByLetterGrade[letter] = 'Add components to see requirements';
    } else if (percentageRemaining === 0) {
      if (currentGrade !== null && currentGrade >= targetGrade) {
        requiredByLetterGrade[letter] = 'Already secured';
      } else {
        requiredByLetterGrade[letter] = 'No longer possible';
      }
    } else {
      const gradedAvg = currentGrade ?? 0;
      const requiredAverage =
        (targetGrade * totalWeight - gradedAvg * percentageGraded) / totalRemainingWeight;

      if (requiredAverage > 100) {
        requiredByLetterGrade[letter] = 'No longer possible';
      } else if (requiredAverage < 0) {
        requiredByLetterGrade[letter] = 'Already secured';
      } else {
        requiredByLetterGrade[letter] = `${requiredAverage.toFixed(2)}%`;
      }
    }
  });

  let status = 'On Track';
  if (totalWeight === 0) {
    status = 'No components added';
  } else if (currentGrade !== null) {
    if (currentGrade >= scale.A.min) {
      status = 'Excellent';
    } else if (currentGrade >= scale.B.min) {
      status = 'Good';
    } else if (currentGrade >= scale.C.min) {
      status = 'At Risk';
    } else {
      status = 'Needs Improvement';
    }
  }

  let weightWarning = '';
  if (totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01) {
    weightWarning = `Warning: Component weights total ${totalWeight.toFixed(2)}%, expected 100%`;
  }

  return {
    currentGrade,
    percentageGraded,
    percentageRemaining,
    projectedFinalGrade: projectedFinalGrade !== null ? Math.round(projectedFinalGrade * 100) / 100 : null,
    requiredByLetterGrade,
    status,
    components,
    weightWarning,
  };
};

export interface RequiredForLetterResult {
  error?: string;
  targetLetter?: string;
  targetMin?: number;
  requiredAverage?: number | null;
  status?: 'achievable' | 'already_secured' | 'not_possible';
  currentGrade?: number | null;
  remainingComponents?: { name: string; weight: number }[];
}

export const computeRequiredForLetter = (
  components: GradeComponentInput[],
  scale: GradeScale,
  targetLetter: string
): RequiredForLetterResult => {
  const target = scale[targetLetter.toUpperCase()];
  if (!target) return { error: `Unknown letter grade: ${targetLetter}` };

  let weightedGrade = 0;
  let gradedWeight = 0;
  let remainingWeight = 0;
  const remainingComponents: { name: string; weight: number }[] = [];

  for (const comp of components) {
    const weight = parseFloat(String(comp.weight));
    if (comp.graded && comp.grade !== null) {
      weightedGrade += (parseFloat(String(comp.grade)) * weight) / 100;
      gradedWeight += weight;
    } else {
      remainingWeight += weight;
      remainingComponents.push({ name: String(comp.name ?? ''), weight });
    }
  }

  const totalWeight = gradedWeight + remainingWeight;
  const rawCurrentGrade = gradedWeight > 0 ? weightedGrade / (gradedWeight / 100) : null;
  const currentGrade = rawCurrentGrade !== null ? round2(rawCurrentGrade) : null;
  const gradedAvg = currentGrade ?? 0;

  const base = {
    targetLetter: targetLetter.toUpperCase(),
    targetMin: target.min,
    currentGrade,
    remainingComponents,
  };

  if (remainingWeight === 0) {
    return {
      ...base,
      requiredAverage: null,
      status: currentGrade !== null && currentGrade >= target.min ? 'already_secured' : 'not_possible',
    };
  }

  const requiredAverage = (target.min * totalWeight - gradedAvg * gradedWeight) / remainingWeight;

  return {
    ...base,
    requiredAverage: round2(requiredAverage),
    status: requiredAverage > 100 ? 'not_possible' : requiredAverage < 0 ? 'already_secured' : 'achievable',
  };
};

export interface ScenarioResult {
  projectedGrade: number | null;
  projectedLetter: string;
  coveragePercent: number;
  unmatchedNames: string[];
}

export const computeScenario = (
  components: GradeComponentInput[],
  scale: GradeScale,
  hypotheticalScores: Record<string, number>,
  allRemainingScore?: number
): ScenarioResult => {
  const normalize = (s: string) => s.trim().toLowerCase();

  const scoreByComponent = new Map<GradeComponentInput, number>();
  const unmatchedNames: string[] = [];

  if (allRemainingScore !== undefined && Number.isFinite(allRemainingScore)) {
    for (const comp of components) {
      if (!(comp.graded && comp.grade !== null)) {
        scoreByComponent.set(comp, allRemainingScore);
      }
    }
  }

  for (const [key, score] of Object.entries(hypotheticalScores)) {
    const wanted = normalize(key);
    let match = components.find((c) => normalize(String(c.name ?? '')) === wanted);
    if (!match) {
      const partial = components.filter((c) =>
        normalize(String(c.name ?? '')).includes(wanted)
      );
      if (partial.length === 1) match = partial[0];
    }
    if (match) scoreByComponent.set(match, score);
    else unmatchedNames.push(key);
  }

  let totalWeight = 0;
  let coveredWeight = 0;
  let weightedSum = 0;

  for (const comp of components) {
    const weight = parseFloat(String(comp.weight));
    totalWeight += weight;
    const hypothetical = scoreByComponent.get(comp);
    const score =
      hypothetical !== undefined
        ? Math.max(0, Math.min(100, hypothetical))
        : comp.graded && comp.grade !== null
        ? parseFloat(String(comp.grade))
        : null;
    if (score !== null) {
      weightedSum += (score * weight) / 100;
      coveredWeight += weight;
    }
  }

  const projectedGrade = coveredWeight > 0 ? round2(weightedSum / (coveredWeight / 100)) : null;

  return {
    projectedGrade,
    projectedLetter: letterFor(projectedGrade, scale),
    coveragePercent: totalWeight > 0 ? Math.round((coveredWeight / totalWeight) * 100) : 0,
    unmatchedNames,
  };
};
