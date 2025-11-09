import { db, auth, signInAnonymously } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const subjectButtons = document.querySelectorAll("#subjects button");
const subjectSelection = document.getElementById("subject-selection");
const quizArea = document.getElementById("quiz-area");
const questionBox = document.getElementById("question-box");
const optionsBox = document.getElementById("options-box");
const nextBtn = document.getElementById("next-btn");
const resultArea = document.getElementById("result-area");
const finalScore = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

// 🆕 create summary container
const summaryBox = document.createElement("div");
summaryBox.id = "summary-box";
resultArea.appendChild(summaryBox);

let questions = [];
let currentIndex = 0;
let score = 0;

// 🆕 keep track of answers
let answersSummary = [];

signInAnonymously(auth)
  .then(() => console.log("Signed in anonymously"))
  .catch((err) => console.error("Auth error:", err));

subjectButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    startGame(btn.dataset.subject);
  });
});

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i = i - 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function startGame(subject) {
  subjectSelection.classList.add("hidden");
  quizArea.classList.remove("hidden");
  resultArea.classList.add("hidden");
  score = 0;
  currentIndex = 0;
  answersSummary = []; // 🆕 reset summary

  try {
    const itemsRef = collection(db, "questions", subject, "items");
    const qSnap = await getDocs(itemsRef);

    if (qSnap.empty) {
      alert(`No questions found for ${subject}!`);
      quizArea.classList.add("hidden");
      subjectSelection.classList.remove("hidden");
      return;
    }

    let allQuestions = [];
    qSnap.forEach((doc) => allQuestions.push(doc.data()));

    questions = shuffleArray(allQuestions).slice(0, Math.min(10, allQuestions.length));
    showQuestion();
  } catch (error) {
    alert("Error loading questions: " + error.message);
    quizArea.classList.add("hidden");
    subjectSelection.classList.remove("hidden");
  }
}

function showQuestion() {
  if (currentIndex >= questions.length) {
    return endGame();
  }

  const q = questions[currentIndex];
  questionBox.textContent = `Q${currentIndex + 1}. ${q.question}`;
  optionsBox.innerHTML = "";

  const correctAnswer = q.options[q.correctIndex];
  const shuffledOptions = shuffleArray(q.options);
  const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);

  shuffledOptions.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(i, newCorrectIndex, opt, correctAnswer, q.question); // 🆕 pass data
    optionsBox.appendChild(btn);
  });

  nextBtn.style.display = "none";
}

function checkAnswer(selected, correct, selectedText, correctAnswer, questionText) {
  const buttons = optionsBox.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.disabled = true;
    btn.style.cursor = "not-allowed";
  });

  let isCorrect = false;
  if (selected === correct) {
    score += 10;
    buttons[selected].classList.add("correct");
    isCorrect = true;
  } else {
    buttons[selected].classList.add("wrong");
    buttons[correct].classList.add("correct");
  }

  // 🆕 record the question result
  answersSummary.push({
    question: questionText,
    yourAnswer: selectedText,
    correctAnswer: correctAnswer,
    correct: isCorrect,
  });

  nextBtn.style.display = "block";
}

nextBtn.addEventListener("click", () => {
  currentIndex++;
  showQuestion();
});

function endGame() {
  quizArea.classList.add("hidden");
  resultArea.classList.remove("hidden");
  finalScore.textContent = `${score} / ${questions.length * 10}`;

  // 🆕 generate summary
  summaryBox.innerHTML = "<h3>Question Summary</h3>";
  answersSummary.forEach((a, i) => {
    const div = document.createElement("div");
    div.classList.add("summary-item");
    div.innerHTML = `
      <p><strong>Q${i + 1}.</strong> ${a.question}</p>
      <p>${a.correct ? "✅" : "❌"} Your answer: <b>${a.yourAnswer}</b></p>
      ${a.correct ? "" : `<p>✔ Correct answer: <b>${a.correctAnswer}</b></p>`}
      <hr>
    `;
    summaryBox.appendChild(div);
  });
}

restartBtn.addEventListener("click", () => {
  resultArea.classList.add("hidden");
  subjectSelection.classList.remove("hidden");
});