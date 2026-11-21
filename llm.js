import config from "./config.js";

const SYSTEM_PROMPT = `You answer yes/no questions.
Reply in exactly this format and nothing else:
ANSWER: YES or NO
REASON: one short sentence
If the question cannot be answered with yes or no, reply exactly:
ANSWER: NOT_YES_NO`;

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
  const answerMatch = text.match(/ANSWER:\s*(NOT_YES_NO|YES|NO)/i);
  const reasonMatch = text.match(/REASON:\s*(.+)/i);

  return {
    verdict: answerMatch ? answerMatch[1].toUpperCase() : "UNCLEAR",
    reason: reasonMatch ? reasonMatch[1].trim() : "",
  };
}

export async function askAnswerModel(question) {
  const model = config.answerModel;
  const prompt = model.name.includes("Qwen3") ? `${question} /no_think` : question;
  const text = await callModel(model, prompt, 0.7, 200);
  return parseReply(text);
}