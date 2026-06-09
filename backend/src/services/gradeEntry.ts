export interface AiGradeEntry {
  componentId?: unknown;
  score?: unknown;
}

export interface ResolvedGradeEntry {
  componentId: number;
  componentName: string;
  score: number;
}

export const resolveGradeEntry = (
  ai: AiGradeEntry,
  components: { id: number; name: string }[]
): ResolvedGradeEntry | { error: string } => {
  if (ai.componentId === null || ai.componentId === undefined || ai.componentId === '') {
    return { error: "I couldn't tell which component you meant. Try naming it, like \"85 on the midterm\"." };
  }

  const componentId = Number(ai.componentId);
  if (!Number.isInteger(componentId)) {
    return { error: "I couldn't tell which component you meant. Try naming it, like \"85 on the midterm\"." };
  }

  const component = components.find((c) => c.id === componentId);
  if (!component) {
    return { error: "I couldn't match that to a component in this course." };
  }

  if (ai.score === null || ai.score === undefined || ai.score === '') {
    return { error: "I couldn't read a score. Try including a number 0–100." };
  }

  const score = Number(ai.score);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return { error: "I couldn't read a valid score between 0 and 100." };
  }

  return { componentId, componentName: component.name, score: Math.round(score * 100) / 100 };
};
