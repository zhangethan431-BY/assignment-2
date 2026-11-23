const form = document.querySelector("#question-form");
const input = document.querySelector("#question");
const askButton = document.querySelector("#ask-button");
const message = document.querySelector("#message");
const answerCard = document.querySelector("#answer-card");
const answerText = document.querySelector("#answer-text");
const reliabilityCard = document.querySelector("#reliability-card");
const reliabilityText = document.querySelector("#reliability-text");

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
    reliabilityText.textContent = `${data.reliability.level}: ${data.reliability.reason}`;
    answerCard.hidden = false;
    reliabilityCard.hidden = false;
  } catch (err) {
    message.textContent = "Could not reach the server. Is it running?";
  } finally {
    askButton.disabled = false;
  }
});