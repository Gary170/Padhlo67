import { db, auth, signInAnonymously } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  limit
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const subjectButtons = document.querySelectorAll("#subjects button");
const subjectSelection = document.getElementById("subject-selection");
const quizArea = document.getElementById("quiz-area");
const questionBox = document.getElementById("question-box");
const optionsBox = document.getElementById("options-box");
const nextBtn = document.getElementById("next-btn");
const resultArea = document.getElementById("result-area");
const finalScore = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

let questions = [];
let currentIndex = 0;
let score = 0;

// Sign in anonymously (temporary)
signInAnonymously(auth)
  .then(() => console.log("Signed in as guest"))
  .catch((err) => console.error("Auth error", err));

subjectButtons.forEach((btn) => {
  btn.addEventListener("click", () => startGame(btn.dataset.subject));
});

async function startGame(subject) {
  subjectSelection.classList.add("hidden");
  quizArea.classList.remove("hidden");
  score = 0;
  currentIndex = 0;

  // Fetch questions
  const qSnap = await getDocs(
    query(collection(db, "questions", subject, "items"), limit(10))
  );
  questions = qSnap.docs.map((doc) => doc.data());

  showQuestion();
}

function showQuestion() {
  if (currentIndex >= questions.length) return endGame();

  const q = questions[currentIndex];
  questionBox.textContent = `Q${currentIndex + 1}. ${q.question}`;
  optionsBox.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(i, q.correctIndex);
    optionsBox.appendChild(btn);
  });
}

function checkAnswer(selected, correct) {
  if (selected === correct) score += 10;
  currentIndex++;
  showQuestion();
}

function endGame() {
  quizArea.classList.add("hidden");
  resultArea.classList.remove("hidden");
  finalScore.textContent = `${score} / ${questions.length * 10}`;
}

restartBtn.addEventListener("click", () => {
  resultArea.classList.add("hidden");
  subjectSelection.classList.remove("hidden");
});
