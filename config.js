// Reads API keys and model settings from the .env file.
import "dotenv/config";

const config = {
  port: process.env.PORT || 3000,
  answerModel: {
    url: process.env.ANSWER_BASE_URL || "https://api.groq.com/openai/v1",
    name: process.env.ANSWER_MODEL || "allam-2-7b",
    key: process.env.ANSWER_API_KEY,
  },
  independentModel: {
    url: process.env.INDEPENDENT_BASE_URL || "https://api.groq.com/openai/v1",
    name: process.env.INDEPENDENT_MODEL || "openai/gpt-oss-120b",
    key: process.env.INDEPENDENT_API_KEY,
  },
};

export default config;