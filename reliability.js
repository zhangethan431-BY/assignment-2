// Combines the answers from both models into a HIGH / MEDIUM / LOW level.
export function combine(answer, independent) {
  if (answer.verdict === "UNCLEAR") {
    return { level: "LOW", reason: "The answering model could not settle on one answer." };
  }

  const answered = independent.verdict === "YES" || independent.verdict === "NO";
  if (!answered) {
    if (answer.agreeCount >= 4) {
      return { level: "MEDIUM", reason: "The answers were consistent, but the independent model was unavailable." };
    }
    return { level: "LOW", reason: "The answers were inconsistent and the independent model was unavailable." };
  }

  if (independent.verdict !== answer.verdict) {
    return { level: "LOW", reason: "The independent model gave the opposite answer." };
  }
  if (answer.agreeCount >= 4) {
    return { level: "HIGH", reason: `The answer was consistent (${answer.agreeCount} of ${answer.total}) and the independent model agreed.` };
  }
  if (answer.agreeCount === 3) {
    return { level: "MEDIUM", reason: `The independent model agreed, but the answers were split (${answer.agreeCount} of ${answer.total}).` };
  }
  return { level: "LOW", reason: `The answers were too split to rely on (${answer.agreeCount} of ${answer.total}).` };
}
