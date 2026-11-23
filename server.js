import express from "express";
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

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});