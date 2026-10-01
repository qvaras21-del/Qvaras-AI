const chat = document.getElementById("chat");
const form = document.getElementById("messageForm");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const typing = document.getElementById("typing");

let history = [];

function removeWelcome() {
  const welcome = document.querySelector(".welcome");

  if (welcome) {
    welcome.remove();
  }
}

function addMessage(role, text) {
  removeWelcome();

  const message = document.createElement("div");

  message.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "👤" : "✦";

  const content = document.createElement("div");
  content.className = "message-content";

  // textContent защищает от HTML/XSS
  content.textContent = text;

  message.appendChild(avatar);
  message.appendChild(content);

  chat.appendChild(message);

  chat.scrollTop = chat.scrollHeight;
}

function showTyping() {
  typing.classList.remove("hidden");

  chat.scrollTop = chat.scrollHeight;
}

function hideTyping() {
  typing.classList.add("hidden");
}

async function sendMessage(message) {
  addMessage("user", message);

  showTyping();

  sendButton.disabled = true;
  input.disabled = true;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message,
        history
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Произошла ошибка"
      );
    }

    const answer = data.answer;

    addMessage("assistant", answer);

    history.push({
      role: "user",
      content: message
    });

    history.push({
      role: "assistant",
      content: answer
    });

    // Ограничиваем историю
    if (history.length > 20) {
      history = history.slice(-20);
    }

  } catch (error) {
    console.error(error);

    addMessage(
      "assistant",
      "❌ Ошибка: " + error.message
    );

  } finally {
    hideTyping();

    sendButton.disabled = false;
    input.disabled = false;

    input.focus();
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = input.value.trim();

  if (!message) {
    return;
  }

  input.value = "";

  input.style.height = "48px";

  await sendMessage(message);
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    form.requestSubmit();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";

  input.style.height =
    Math.min(input.scrollHeight, 150) + "px";
});

clearButton.addEventListener("click", () => {
  history = [];

  chat.innerHTML = `
    <div class="welcome">

      <div class="welcome-icon">
        ✨
      </div>

      <h2>Привет! 👋</h2>

      <p>
        Я AI-помощник. Задай мне любой вопрос.
      </p>

      <div class="suggestions">

        <button class="suggestion">
          💡 Объясни сложную тему
        </button>

        <button class="suggestion">
          💻 Помоги написать код
        </button>

        <button class="suggestion">
          ✍️ Напиши текст
        </button>

      </div>

    </div>
  `;

  attachSuggestions();
});

function attachSuggestions() {
  document
    .querySelectorAll(".suggestion")
    .forEach(button => {

      button.addEventListener("click", () => {

        input.value = button.textContent
          .replace(/^[^ ]+ /, "")
          .trim();

        input.focus();

        input.style.height = "auto";
        input.style.height =
          Math.min(input.scrollHeight, 150) + "px";
      });

    });
}

attachSuggestions();
