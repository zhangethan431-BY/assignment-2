const form = document.querySelector("#question-form");
const input = document.querySelector("#question");
const askButton = document.querySelector("#ask-button");
const message = document.querySelector("#message");
const answerCard = document.querySelector("#answer-card");
const answerText = document.querySelector("#answer-text");
const reliabilityCard = document.querySelector("#reliability-card");
const reliabilityText = document.querySelector("#reliability-text");
const reliabilityBar = document.querySelector("#reliability-bar");
const viewToggle = document.querySelector("#view-toggle");
const reasonsPanel = document.querySelector("#reasons-panel");
const reasonsSummary = document.querySelector("#reasons-summary");
const answerReasons = document.querySelector("#answer-reasons");
const independentReason = document.querySelector("#independent-reason");
const decisionForm = document.querySelector("#decision-form");
const saveButton = document.querySelector("#save-button");
const decisionMessage = document.querySelector("#decision-message");

const FILLED_SEGMENTS = { LOW: 1, MEDIUM: 2, HIGH: 3 };
let lastReliability = null;
let lastQuestion = "";
let lastAnswer = "";
let reasonsOpened = false;

function showReliability() {
  if (!lastReliability) return;
  const level = lastReliability.level;
  const view = document.querySelector('input[name="view"]:checked').value;

  if (view === "words") {
    reliabilityText.textContent = `${level}: ${lastReliability.reason}`;
    reliabilityText.hidden = false;
    reliabilityBar.hidden = true;
  } else {
    const segments = reliabilityBar.querySelectorAll("span");
    for (let i = 0; i < segments.length; i++) {
      segments[i].classList.toggle("filled", i < FILLED_SEGMENTS[level]);
    }
    reliabilityBar.dataset.level = level;
    reliabilityBar.setAttribute("aria-label", `Reliability: ${level}`);
    reliabilityText.hidden = true;
    reliabilityBar.hidden = false;
  }
}

viewToggle.addEventListener("change", showReliability);

function showReasons(answer, independent) {
  answerReasons.textContent = "";
  for (const sample of answer.samples) {
    const item = document.createElement("li");
    item.textContent = `${sample.verdict}: ${sample.reason || "(no reason given)"}`;
    answerReasons.append(item);
  }

  if (independent.verdict === "UNAVAILABLE") {
    independentReason.textContent = "The independent model was unavailable.";
  } else {
    independentReason.textContent = `${independent.verdict}: ${independent.reason || "(no reason given)"}`;
  }
}

reasonsPanel.addEventListener("toggle", () => {
  if (reasonsPanel.open) reasonsOpened = true;
});

decisionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const record = {
    question: lastQuestion,
    answer: lastAnswer,
    reliability: lastReliability.level,
    view: document.querySelector('input[name="view"]:checked').value,
    reasonsOpened,
    decision: document.querySelector('input[name="decision"]:checked').value,
    trust: Number(document.querySelector('input[name="trust"]:checked').value),
  };

  try {
    const response = await fetch("/api/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error("Save failed");
    decisionMessage.textContent = "Saved. You can ask another question.";
    saveButton.disabled = true;
  } catch (err) {
    decisionMessage.textContent = "Could not save your decision.";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  answerCard.hidden = true;
  reliabilityCard.hidden = true;
  decisionForm.hidden = true;
  message.textContent = "Asking both models...";
  askButton.disabled = true;

  try {
    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input.value }),
    });
    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.error;
      return;
    }
    if (data.answer.verdict === "NOT_YES_NO") {
      message.textContent = "This tool only checks yes/no questions.";
      return;
    }

    message.textContent = "";
    lastQuestion = input.value.trim();
    lastAnswer = data.answer.verdict;
    answerText.textContent = lastAnswer === "UNCLEAR" ? "No clear answer" : lastAnswer;
    lastReliability = data.reliability;
    showReliability();
    showReasons(data.answer, data.independent);
    reasonsPanel.open = false;
    reasonsSummary.textContent = data.reliability.level === "LOW"
      ? "Check the reasons before relying on this answer"
      : "Show reasons";
    reasonsOpened = false;
    decisionForm.reset();
    decisionMessage.textContent = "";
    saveButton.disabled = false;
    answerCard.hidden = false;
    reliabilityCard.hidden = false;
    decisionForm.hidden = false;
  } catch (err) {
    message.textContent = "Could not reach the server. Is it running?";
  } finally {
    askButton.disabled = false;
  }
});