import { db, auth, signInAnonymously } from "./firebase.js";
import {
  collection,
  getDocs
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

// Sign in anonymously
signInAnonymously(auth)
  .then(() => console.log("Signed in anonymously"))
  .catch((err) => console.error("Auth error:", err));

// Add click events to subject buttons
subjectButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    console.log("Button clicked:", btn.dataset.subject);
    startGame(btn.dataset.subject);
  });
});

// Shuffle array helper
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function startGame(subject) {
  console.log("Starting game for:", subject);

  try {
    subjectSelection.classList.add("hidden");
    quizArea.classList.remove("hidden");
    score = 0;
    currentIndex = 0;

    console.log("Fetching questions...");

    // Fetch questions from Firestore
    const qSnap = await getDocs(collection(db, "questions", subject.toLowerCase(), "items"));
    console.log("Questions fetched:", qSnap.docs.length);

    if (qSnap.empty) {
      alert("No questions found for this subject!");
      quizArea.classList.add("hidden");
      subjectSelection.classList.remove("hidden");
      return;
    }

    // Get all questions and shuffle them
    let allQuestions = [];
    qSnap.docs.forEach((doc) => {
      allQuestions.push(doc.data());
    });

    allQuestions = shuffleArray(allQuestions);
    questions = allQuestions.slice(0, Math.min(10, allQuestions.length));

    console.log("Selected questions:", questions.length);

    showQuestion();
  } catch (error) {
    console.error("Error in startGame:", error);
    alert("Error loading questions: " + error.message);
    quizArea.classList.add("hidden");
    subjectSelection.classList.remove("hidden");
  }
}

function showQuestion() {
  console.log("Showing question:", currentIndex);

  if (currentIndex >= questions.length) {
    return endGame();
  }

  const q = questions[currentIndex];
  questionBox.textContent = `Q${currentIndex + 1}. ${q.question}`;
  optionsBox.innerHTML = "";

  // Shuffle options
  const correctAnswer = q.options[q.correctIndex];
  const shuffledOptions = shuffleArray(q.options);
  const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);

  shuffledOptions.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(i, newCorrectIndex);
    optionsBox.appendChild(btn);
  });

  nextBtn.style.display = "none";
}

function checkAnswer(selected, correct) {
  const buttons = optionsBox.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.disabled = true;
    btn.style.cursor = "not-allowed";
  });

  if (selected === correct) {
    score += 10;
    buttons[selected].classList.add("correct");
  } else {
    buttons[selected].classList.add("wrong");
    buttons[correct].classList.add("correct");
  }

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
}

restartBtn.addEventListener("click", () => {
  resultArea.classList.add("hidden");
  subjectSelection.classList.remove("hidden");
});