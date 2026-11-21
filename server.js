import express from "express";
import config from "./config.js";
import { askAnswerModel } from "./llm.js";

const app = express();
app.use(express.json());

// Receives a question and returns the answering model's verdict and reason.
app.post("/api/answer", async (req, res) => {
  if (!config.answerModel.key) {
    return res.status(503).json({ error: "No ANSWER_API_KEY in .env" });
  }

  const question = req.body?.question;
  if (typeof question !== "string" || !question.trim() || question.length > 300) {
    return res.status(400).json({ error: "Please send a question (1-300 characters)." });
  }

  try {
    const result = await askAnswerModel(question.trim());
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: err.message });
  }
});

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});