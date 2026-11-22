import config from "./config.js";

const SYSTEM_PROMPT = `You answer yes/no questions.
Reply in exactly this format and nothing else:
ANSWER: YES or NO
REASON: one short sentence`;

// Sends one question to a model and returns the text of its reply.
export async function callModel(model, question, temperature, maxTokens) {
  const response = await fetch(`${model.url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${model.key}`,
    },
    body: JSON.stringify({
      model: model.name,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${model.name} returned error ${response.status}: ${detail}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Turns "ANSWER: NO\nREASON: ..." into { verdict: "NO", reason: "..." }.
export function parseReply(text) {
  const answerMatch = text.match(/ANSWER:\s*(YES|NO)/i) || text.match(/^\s*(YES|NO)\b/i);
  const reasonMatch = text.match(/REASON:\s*(.+)/i) || text.match(/\n\s*(.+)/);

  return {
    verdict: answerMatch ? answerMatch[1].toUpperCase() : "UNCLEAR",
    reason: reasonMatch ? reasonMatch[1].trim() : "",
  };
}

// Yes/no questions in English usually start with one of these words.
const YES_NO_STARTS = [
  "is", "are", "was", "were", "am",
  "do", "does", "did",
  "can", "could", "will", "would", "should", "shall", "may", "might", "must",
  "has", "have", "had",
  "isn't", "aren't", "wasn't", "weren't", "don't", "doesn't", "didn't",
  "can't", "couldn't", "won't", "wouldn't", "shouldn't", "hasn't", "haven't", "hadn't",
];

// Checks the first word of the question.
export function looksLikeYesNo(question) {
  const firstWord = question.trim().split(/\s+/)[0].toLowerCase().replace("\u2019", "'");
  return YES_NO_STARTS.includes(firstWord);
}

export async function askAnswerModel(question) {
  if (!looksLikeYesNo(question)) {
    return { verdict: "NOT_YES_NO", reason: "" };
  }
  const model = config.answerModel;
  const text = await callModel(model, question, 0.7, 200);
  return parseReply(text);
}