import express from "express";
import { appendFile } from "node:fs/promises";
import config from "./config.js";
import { looksLikeYesNo, checkConsistency, askIndependentModel } from "./llm.js";
import { combine } from "./reliability.js";

const app = express();
app.use(express.json());
app.use(express.static("web"));

// Receives a question, asks both models and returns the answer with its reliability level.
app.post("/api/answer", async (req, res) => {
  if (!config.answerModel.key) {
    return res.status(503).json({ error: "No ANSWER_API_KEY in .env" });
  }

  const question = req.body?.question;
  if (typeof question !== "string" || !question.trim() || question.length > 300) {
    return res.status(400).json({ error: "Please send a question (1-300 characters)." });
  }

  try {
    const q = question.trim();
    if (!looksLikeYesNo(q)) {
      return res.json({ answer: { verdict: "NOT_YES_NO" } });
    }
    const [answer, independent] = await Promise.all([
      checkConsistency(q),
      askIndependentModel(q),
    ]);
    res.json({ answer, independent, reliability: combine(answer, independent) });
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: err.message });
  }
});

// Saves one decision as a line in decisions.jsonl.
app.post("/api/decision", async (req, res) => {
  const { decision, trust } = req.body;
  if (!["rely", "not-rely"].includes(decision) || ![1, 2, 3, 4, 5].includes(trust)) {
    return res.status(400).json({ error: "Invalid decision or trust rating." });
  }
  const record = { ...req.body, time: new Date().toISOString() };
  try {
    await appendFile("decisions.jsonl", JSON.stringify(record) + "\n");
    res.json({ saved: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not save the decision." });
  }
});

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});