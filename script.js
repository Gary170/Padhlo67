import { db, auth, signInAnonymously } from “./firebase.js”;
import {
collection,
getDocs,
doc,
getDoc
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

// Sign in anonymously
signInAnonymously(auth)
.then(() => console.log(“✓ Signed in anonymously”))
.catch((err) => console.error(“✗ Auth error:”, err));

// Add click events to subject buttons
subjectButtons.forEach((btn) => {
console.log(“Button found:”, btn.textContent, “Data attribute:”, btn.dataset.subject);
btn.addEventListener(“click”, () => {
console.log(”=== BUTTON CLICKED ===”);
console.log(“Subject:”, btn.dataset.subject);
startGame(btn.dataset.subject);
});
});

// Shuffle array helper
function shuffleArray(array) {
const arr = […array];
for (let i = arr.length - 1; i > 0; i–) {
const j = Math.floor(Math.random() * (i + 1));
[arr[i], arr[j]] = [arr[j], arr[i]];
}
return arr;
}

async function startGame(subject) {
console.log(”=== STARTING GAME ===”);
console.log(“Subject received:”, subject);

try {
subjectSelection.classList.add(“hidden”);
quizArea.classList.remove(“hidden”);
score = 0;
currentIndex = 0;

```
console.log("Fetching questions from Firestore...");
console.log("Path: questions/" + subject + "/items");

// Try to access the parent document first to check if it exists
const subjectDocRef = doc(db, "questions", subject);
const subjectDoc = await getDoc(subjectDocRef);

if (!subjectDoc.exists()) {
  console.error("✗ Parent document 'questions/" + subject + "' does not exist!");
  alert(`The subject document '${subject}' doesn't exist in Firestore. Please check your database structure.`);
  quizArea.classList.add("hidden");
  subjectSelection.classList.remove("hidden");
  return;
}

console.log("✓ Parent document exists:", subjectDoc.data());

// Now access the subcollection
const itemsRef = collection(db, "questions", subject, "items");
console.log("Fetching from subcollection 'items'...");

const qSnap = await getDocs(itemsRef);

console.log("✓ Query completed. Documents found:", qSnap.size);

if (qSnap.empty) {
  console.warn("✗ No questions found in subcollection!");
  alert(`No questions found for ${subject}! Please add questions to: questions/${subject}/items`);
  quizArea.classList.add("hidden");
  subjectSelection.classList.remove("hidden");
  return;
}

// Get all questions and shuffle
let allQuestions = [];
qSnap.forEach((doc) => {
  console.log("Question doc ID:", doc.id);
  console.log("Question data:", doc.data());
  allQuestions.push(doc.data());
});

console.log("✓ Total questions loaded:", allQuestions.length);

// Validate question structure
const invalidQuestions = allQuestions.filter(q => 
  !q.question || !q.options || !Array.isArray(q.options) || q.correctIndex === undefined
);

if (invalidQuestions.length > 0) {
  console.error("✗ Invalid question structure found:", invalidQuestions);
  alert("Some questions have invalid structure. Check console for details.");
}

// Shuffle and take up to 10 questions
questions = shuffleArray(allQuestions).slice(0, Math.min(10, allQuestions.length));
console.log("✓ Selected questions for quiz:", questions.length);

showQuestion();
```

} catch (error) {
console.error(”=== ERROR IN STARTGAME ===”);
console.error(“Error type:”, error.name);
console.error(“Error message:”, error.message);
console.error(“Full error:”, error);
alert(“Error loading questions: “ + error.message + “\n\nCheck console for details.”);
quizArea.classList.add(“hidden”);
subjectSelection.classList.remove(“hidden”);
}
}

function showQuestion() {
console.log(”=== SHOWING QUESTION ===”);
console.log(“Question index:”, currentIndex + 1, “of”, questions.length);

if (currentIndex >= questions.length) {
console.log(“No more questions, ending game”);
return endGame();
}

const q = questions[currentIndex];
console.log(“Current question object:”, q);

if (!q || !q.question || !q.options) {
console.error(“✗ Invalid question structure:”, q);
alert(“Invalid question data. Skipping…”);
currentIndex++;
showQuestion();
return;
}

questionBox.textContent = `Q${currentIndex + 1}. ${q.question}`;
optionsBox.innerHTML = “”;

// Shuffle options and track correct answer
const correctAnswer = q.options[q.correctIndex];
console.log(“Correct answer:”, correctAnswer, “(index:”, q.correctIndex + “)”);

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
console.log(”=== ANSWER CHECKED ===”);
console.log(“User selected:”, selected, “Correct is:”, correct);

const buttons = optionsBox.querySelectorAll(“button”);
buttons.forEach((btn) => {
btn.disabled = true;
btn.style.cursor = “not-allowed”;
});

if (selected === correct) {
score += 10;
buttons[selected].classList.add(“correct”);
console.log(“✓ Correct! Score:”, score);
} else {
buttons[selected].classList.add(“wrong”);
buttons[correct].classList.add(“correct”);
console.log(“✗ Wrong! Score:”, score);
}

nextBtn.style.display = “block”;
}

nextBtn.addEventListener(“click”, () => {
console.log(“Next button clicked”);
currentIndex++;
showQuestion();
});

function endGame() {
console.log(”=== GAME ENDED ===”);
console.log(“Final score:”, score, “/”, questions.length * 10);
quizArea.classList.add(“hidden”);
resultArea.classList.remove(“hidden”);
finalScore.textContent = `${score} / ${questions.length * 10}`;
}

restartBtn.addEventListener(“click”, () => {
console.log(“Restarting quiz”);
resultArea.classList.add(“hidden”);
subjectSelection.classList.remove(“hidden”);
});