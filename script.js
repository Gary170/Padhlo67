import { db, auth, signInAnonymously } from “./firebase.js”;
import { collection, getDocs } from “https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js”;

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

signInAnonymously(auth)
.then(() => console.log(“Signed in anonymously”))
.catch((err) => console.error(“Auth error:”, err));

subjectButtons.forEach((btn) => {
btn.addEventListener(“click”, () => {
console.log(“Button clicked:”, btn.dataset.subject);
startGame(btn.dataset.subject);
});
});

function shuffleArray(array) {
const arr = […array];
for (let i = arr.length - 1; i > 0; i–) {
const j = Math.floor(Math.random() * (i + 1));
[arr[i], arr[j]] = [arr[j], arr[i]];
}
return arr;
}

async function startGame(subject) {
console.log(“Starting game for:”, subject);

try {
subjectSelection.classList.add(“hidden”);
quizArea.classList.remove(“hidden”);
score = 0;
currentIndex = 0;

```
console.log("Fetching questions...");

const itemsRef = collection(db, "questions", subject, "items");
const qSnap = await getDocs(itemsRef);

console.log("Questions fetched:", qSnap.size);

if (qSnap.empty) {
  console.warn("No questions found!");
  alert(`No questions found for ${subject}!`);
  quizArea.classList.add("hidden");
  subjectSelection.classList.remove("hidden");
  return;
}

let allQuestions = [];
qSnap.forEach((doc) => {
  console.log("Question doc:", doc.id, doc.data());
  allQuestions.push(doc.data());
});

console.log("Total questions loaded:", allQuestions.length);

questions = shuffleArray(allQuestions).slice(0, Math.min(10, allQuestions.length));
console.log("Selected questions for quiz:", questions.length);

showQuestion();
```

} catch (error) {
console.error(“Error in startGame:”, error);
alert(“Error loading questions: “ + error.message);
quizArea.classList.add(“hidden”);
subjectSelection.classList.remove(“hidden”);
}
}

function showQuestion() {
console.log(“Showing question:”, currentIndex + 1, “of”, questions.length);

if (currentIndex >= questions.length) {
console.log(“No more questions, ending game”);
return endGame();
}

const q = questions[currentIndex];
console.log(“Current question:”, q);

questionBox.textContent = `Q${currentIndex + 1}. ${q.question}`;
optionsBox.innerHTML = “”;

const correctAnswer = q.options[q.correctIndex];
console.log(“Correct answer:”, correctAnswer);

const shuffledOptions = shuffleArray(q.options);
const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);

console.log(“Shuffled options:”, shuffledOptions);
console.log(“New correct index:”, newCorrectIndex);

shuffledOptions.forEach((opt, i) => {
const btn = document.createElement(“button”);
btn.textContent = opt;
btn.onclick = () => checkAnswer(i, newCorrectIndex);
optionsBox.appendChild(btn);
});

nextBtn.style.display = “none”;
}

function checkAnswer(selected, correct) {
console.log(“User selected:”, selected, “Correct is:”, correct);

const buttons = optionsBox.querySelectorAll(“button”);
buttons.forEach((btn) => {
btn.disabled = true;
btn.style.cursor = “not-allowed”;
});

if (selected === correct) {
score += 10;
buttons[selected].classList.add(“correct”);
console.log(“Correct! Score:”, score);
} else {
buttons[selected].classList.add(“wrong”);
buttons[correct].classList.add(“correct”);
console.log(“Wrong! Score:”, score);
}

nextBtn.style.display = “block”;
}

nextBtn.addEventListener(“click”, () => {
console.log(“Next button clicked”);
currentIndex++;
showQuestion();
});

function endGame() {
console.log(“Game ended. Final score:”, score, “/”, questions.length * 10);
quizArea.classList.add(“hidden”);
resultArea.classList.remove(“hidden”);
finalScore.textContent = `${score} / ${questions.length * 10}`;
}

restartBtn.addEventListener(“click”, () => {
console.log(“Restarting quiz”);
resultArea.classList.add(“hidden”);
subjectSelection.classList.remove(“hidden”);
});