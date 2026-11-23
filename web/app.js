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

const FILLED_SEGMENTS = { LOW: 1, MEDIUM: 2, HIGH: 3 };
let lastReliability = null;

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

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  answerCard.hidden = true;
  reliabilityCard.hidden = true;
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
    answerText.textContent = data.answer.verdict;
    lastReliability = data.reliability;
    showReliability();
    answerCard.hidden = false;
    reliabilityCard.hidden = false;
  } catch (err) {
    message.textContent = "Could not reach the server. Is it running?";
  } finally {
    askButton.disabled = false;
  }
});