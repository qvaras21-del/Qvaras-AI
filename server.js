require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Сообщение не указано"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "API ключ не настроен на сервере"
      });
    }

    const messages = [
      {
        role: "system",
        content:
          "Ты полезный AI-ассистент. Отвечай понятно, кратко и на языке пользователя."
      },
      ...history
        .filter(item => item.role === "user" || item.role === "assistant")
        .slice(-20),
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(response.status).json({
        error: data?.error?.message || "Ошибка API"
      });
    }

    const answer =
      data?.choices?.[0]?.message?.content ||
      "Не удалось получить ответ.";

    res.json({
      answer
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Внутренняя ошибка сервера"
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`AI Chat запущен: http://localhost:${PORT}`);
});
