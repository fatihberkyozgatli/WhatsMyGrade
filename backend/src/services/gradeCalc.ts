import { GradeScale } from '../constants';

export interface GradeComponentInput {
  weight: number | string;
  graded: boolean;
  grade: number | string | null;
  [key: string]: unknown;
}

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
