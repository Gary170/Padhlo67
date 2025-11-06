import { db, auth, signInAnonymously } from “./firebase.js”;
import {
collection,
getDocs
} from “https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js”;

const subjectButtons = document.querySelectorAll(”#subjects button”);
const subjectSelection = document.getElementById(“subject-selection”);
const quizArea = document.getElementById(“quiz-area”);
const questionBox = document.getElementById(“question-box”);
const optionsBox = document.getElementById(“options-box”);
const nextBtn = document.getElementById(“next-btn”);
const resultArea = document.getElementById(“result-area”);
const finalScore = document.getElementById(“final-score”);
const restartBtn = document.getElementById(“restart-btn”);

let questions = [];
let currentIndex = 0;
let score = 0;

// Sign in anonymously (temporary)
signInAnonymously(auth)
.then(() => console.log(“Signed in as guest”))
.catch((err) => console.error(“Auth error”, err));

subjectButtons.forEach((btn) => {
btn.addEventListener(“click”, () => startGame(btn.dataset.subject));
});

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
const shuffled = […array];
for (let i = shuffled.length - 1; i > 0; i–) {
const j = Math.floor(Math.random() * (i + 1));
[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}
return shuffled;
}

async function startGame(subject) {
try {
subjectSelection.classList.add(“hidden”);
quizArea.classList.remove(“hidden”);
score = 0;
currentIndex = 0;

```
// Fetch ALL questions from the collection
const qSnap = await getDocs(
  collection(db, "questions", subject, "items")
);

// Get all questions
const allQuestions = qSnap.docs.map((doc) => doc.data());

// Shuffle all questions
const shuffledQuestions = shuffleArray(allQuestions);

// Take only 10 random questions
questions = shuffledQuestions.slice(0, 10);

// For each question, shuffle options and update correctIndex
questions = questions.map(q => {
  const correctAnswer = q.options[q.correctIndex]; // Store the correct answer text
  const shuffledOptions = shuffleArray(q.options); // Shuffle options
  const newCorrectIndex = shuffledOptions.indexOf(correctAnswer); // Find new position of correct answer
  
  return {
    ...q,
    options: shuffledOptions,
    correctIndex: newCorrectIndex
  };
});

showQuestion();
```

} catch (error) {
console.error(“Error starting game:”, error);
alert(“Error loading questions. Please try again.”);
quizArea.classList.add(“hidden”);
subjectSelection.classList.remove(“hidden”);
}
}

function showQuestion() {
if (currentIndex >= questions.length) return endGame();

const q = questions[currentIndex];
questionBox.textContent = `Q${currentIndex + 1}. ${q.question}`;
optionsBox.innerHTML = “”;

// Display the already shuffled options
q.options.forEach((opt, i) => {
const btn = document.createElement(“button”);
btn.textContent = opt;
btn.onclick = () => checkAnswer(i, q.correctIndex);
optionsBox.appendChild(btn);
});

nextBtn.style.display = “none”;
}

function checkAnswer(selected, correct) {
const buttons = optionsBox.querySelectorAll(“button”);

// Disable all buttons after selection
buttons.forEach(btn => {
btn.disabled = true;
btn.style.cursor = “not-allowed”;
});

if (selected === correct) {
score += 10;
buttons[selected].classList.add(“correct”);
} else {
buttons[selected].classList.add(“wrong”);
// Highlight the correct answer
buttons[correct].classList.add(“correct”);
}

nextBtn.style.display = “block”;
}

nextBtn.addEventListener(“click”, () => {
currentIndex++;
showQuestion();
});

function endGame() {
quizArea.classList.add(“hidden”);
resultArea.classList.remove(“hidden”);
finalScore.textContent = `${score} / ${questions.length * 10}`;
}

restartBtn.addEventListener(“click”, () => {
resultArea.classList.add(“hidden”);
subjectSelection.classList.remove(“hidden”);
});