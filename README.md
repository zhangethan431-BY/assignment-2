# assignment-2
A prototype that answers a yes/no question with a small AI model, cross-checks it with an independent model, and shows a separate reliability cue, so the user can decide whether to rely on the answer.

**Prose word count:** 1003 (code and commands are not counted)

**Submitted version:** release `v1.0-submission`

## Project status

**Works (real model calls, nothing simulated):**

- Questions that do not start with common yes/no question words are rejected by a simple rule before model calls.
- The answering model answers five times. The system takes the majority answer and counts how many agree. If a reply cannot be read as YES or NO, the model is asked again once.
- An independent model answers once, without seeing the first answer.
- A fixed set of rules combines the two checks into High, Medium or Low. It is a heuristic, not a probability, so no percentages are shown.
- The cue is shown as words or as a three-segment bar, never both.
- A reasons panel (closed by default) shows all five answers and the independent answer. When the cue is Low, its label asks the user to check the reasons.
- The user chooses whether to rely on the answer and rates trust from 1 to 5. Each decision is saved locally to `decisions.jsonl`.

**Planned, not built:** checking answers against reliable sources such as Wikipedia or academic papers; open-ended questions; a practice mode with known answers. A user study is planned to compare the words and bar views and to see how they affect users' trust, reliance and decision accuracy. This has not been tested yet.

## Technology stack

| Part | Role |
|---|---|
| Node.js 18+ and Express 5 | Server, web page and API routes |
| dotenv | Reads API keys from `.env` |
| HTML, CSS, JavaScript | The web page (no framework, as one small page does not need one) |
| Groq API | Runs both models; the server calls them through the API |
| `allam-2-7b` | Answering model, small on purpose so that errors happen often enough to test the cue |
| `openai/gpt-oss-120b` | Independent model, larger and from a different developer |

Code: `server.js`, `llm.js`, `reliability.js`, `config.js`, `web/`.

**Still undecided:** the rule's thresholds (4 of 5 for High, 3 of 5 for Medium) are set by judgement, not tuned; whether a Medium level is needed; whether to ask the independent model more than once.

## Running the project

You need Node.js 18+ and a free Groq API key from [console.groq.com](https://console.groq.com). My key is not in this repository.

```bash
git clone https://github.com/zhangethan431-BY/assignment-2.git
cd assignment-2
npm install
cp .env.example .env
```

Put your key into both lines of `.env` (one Groq key works for both models):

```
ANSWER_API_KEY=your_groq_key
INDEPENDENT_API_KEY=your_groq_key
```

```bash
npm start
```

Then open http://localhost:3000. Try "Is 3599 a prime number?", "Is 509 a prime number?" and "What is the capital of France?".

Each question calls the answering model five times and the independent model once, so it takes a few seconds. If you see a 429 error, the free tier limit has been reached; wait a minute. If the independent model fails, the cue can be at most Medium.

## Development record

**1. Calling the model ([1465b23](https://github.com/zhangethan431-BY/assignment-2/commit/1465b23)).** Connected to the AI's API and returned its answer through an Express server. My first model, Qwen3-8B on SiliconFlow, kept returning 429 errors despite very low usage, so I moved the model settings into `config.js` and switched to `allam-2-7b` on Groq. I checked each step with `curl`.

**2. Question type and reply format ([db575c9](https://github.com/zhangethan431-BY/assignment-2/commit/db575c9)).** Declined non-yes/no questions and parsed unlabelled replies. The model ignored my instruction to reject non-yes/no questions and answered "YES" to "What is the capital of France?", so this check now happens in code. Logging the raw replies showed the model sometimes dropped the "ANSWER:" label, so the parser now also reads a YES or NO at the start of a reply.

**3. Consistency check ([9517f11](https://github.com/zhangethan431-BY/assignment-2/commit/9517f11)).** Added a consistency check over 5 samples: the answering model answers five times in parallel at temperature 0.7 (so the answers can vary), and the system takes the majority answer and counts how many agree. For "Is 3599 a prime number?" all five said NO (correct), but all five reasons gave wrong factors, showing that consistency is not correctness.

**4. Independent model and rule ([88bcb28](https://github.com/zhangethan431-BY/assignment-2/commit/88bcb28)).** Added the independent model and the reliability rule. The independent model sees only the question, so it cannot simply agree with the first answer. Unlike the answering model, it is a reasoning model, so it has a larger token limit (1,000 instead of the answering model's 200). If it gives the opposite answer, the cue is Low even when all five answers agree, because letting a wrong answer through is worse than asking the user to double-check a correct one. Before connecting the real models, I tested every case of the rule with made-up results.

**5. Web interface ([861231f](https://github.com/zhangethan431-BY/assignment-2/commit/861231f), [7334643](https://github.com/zhangethan431-BY/assignment-2/commit/7334643), [1a2fc66](https://github.com/zhangethan431-BY/assignment-2/commit/1a2fc66)).** Added a basic web page, then a bar view for the reliability cue, then the reasons panel and decision form, which saves each decision to `decisions.jsonl`. I checked each stage in the browser.

**6. Final check on 12 known-answer questions.** Six prime-number and six general-knowledge questions, each with three YES and three NO answers:

| | Cue High | Cue Low |
|---|---|---|
| Answer correct (6) | 6 | 0 |
| Answer wrong (6) | 0 | 6 |

In each of the six questions with a wrong answer, all five replies from the answering model gave the same answer. If the system had used consistency alone, all six would have been rated as reliable; the cue was Low only because the independent model disagreed. Analysis and limitations are in the report.

## AI assistance

While building the web system, there were some parts of the code that I wasn’t proficient in writing. I sought help and learned the coding methods from the AI. I studied these parts of code that I couldn’t handle, tested them thoroughly to make sure it worked correctly, and checked that it met the system requirements.

For the system diagram, I specified the layout, the content of each section, and how the different components should be connected. AI generated the initial version based on my instructions. I then reviewed the diagram and made further adjustments myself to ensure it accurately represented my system.

## Additional files

None. Everything is in this repository; the report is submitted separately.
