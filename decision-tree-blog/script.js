
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

// Interactive explanations of Decision Tree components
const partInformation = {
  root: {
    symbol: "◎",
    title: "Root Node",
    description:
      "The root node is the starting point of a decision tree. It asks the first question and splits the data into smaller groups.",
    example: "Did the student study for at least 3 hours?"
  },
  branch: {
    symbol: "⑂",
    title: "Branch",
    description:
      "A branch connects nodes and represents a possible outcome of a question. Each branch leads the example toward another question or a final decision.",
    example: "YES: the student studied for 3 or more hours."
  },
  leaf: {
    symbol: "✓",
    title: "Leaf Node",
    description:
      "A leaf node is an endpoint of the tree. It gives the final predicted class or numerical value, depending on the model.",
    example: "The final prediction is PASS."
  },
  split: {
    symbol: "✣",
    title: "Splitting",
    description:
      "Splitting divides the data into smaller groups using a feature and a condition. The algorithm selects splits according to a criterion such as Gini impurity or Entropy.",
    example: "Divide students by attendance: 75% or below versus above 75%."
  }
};

const partButtons = document.querySelectorAll(".part-button");

partButtons.forEach((button) => {
  button.addEventListener("click", () => {
    partButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const part = partInformation[button.dataset.part];

    document.getElementById("partSymbol").textContent = part.symbol;
    document.getElementById("partTitle").textContent = part.title;
    document.getElementById("partDescription").textContent = part.description;
    document.getElementById("partExample").textContent = part.example;
  });
});

// Interactive student decision example
const studyHours = document.getElementById("studyHours");
const attendance = document.getElementById("attendance");
const hoursValue = document.getElementById("hoursValue");
const attendanceValue = document.getElementById("attendanceValue");
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const decisionTrail = document.getElementById("decisionTrail");

function updatePrediction() {
  const hours = Number(studyHours.value);
  const attendancePercent = Number(attendance.value);

  hoursValue.textContent = `${hours} ${hours === 1 ? "hour" : "hours"}`;
  attendanceValue.textContent = `${attendancePercent}%`;

  let passed = false;
  let explanation = "";
  let trail = "";

  if (hours >= 3) {
    passed = true;
    explanation = "The student studies for at least 3 hours, so the first rule predicts Pass.";
    trail = "Study hours: YES → PASS";
  } else if (attendancePercent >= 75) {
    passed = true;
    explanation = "Study hours are below 3, but attendance is at least 75%, so the second rule predicts Pass.";
    trail = "Study hours: NO → Attendance: YES → PASS";
  } else {
    explanation = "Study hours are below 3 and attendance is below 75%. The example recommends improvement.";
    trail = "Study hours: NO → Attendance: NO → REVIEW";
  }

  resultIcon.textContent = passed ? "✓" : "↗";
  resultIcon.classList.toggle("pass", passed);
  resultTitle.textContent = passed ? "Pass" : "Needs improvement";
  resultText.textContent = explanation;
  decisionTrail.textContent = trail;
}

studyHours.addEventListener("input", updatePrediction);
attendance.addEventListener("input", updatePrediction);

document.getElementById("resetDemo").addEventListener("click", () => {
  studyHours.value = 2;
  attendance.value = 60;
  updatePrediction();
});

updatePrediction();

// Copy code buttons
const toast = document.getElementById("toast");
let toastTimeout;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copy);

    if (!target) return;

    const text = target.innerText;

    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard!");
    } catch (error) {
      // Fallback for browsers that block clipboard access
      const temporaryArea = document.createElement("textarea");
      temporaryArea.value = text;
      temporaryArea.style.position = "fixed";
      temporaryArea.style.opacity = "0";
      document.body.appendChild(temporaryArea);
      temporaryArea.select();

      try {
        document.execCommand("copy");
        showToast("Copied to clipboard!");
      } catch (copyError) {
        showToast("Please select and copy the text.");
      }

      temporaryArea.remove();
    }
  });
});

// Knowledge check
const quizOptions = document.querySelectorAll(".quiz-option");
const quizFeedback = document.getElementById("quizFeedback");

quizOptions.forEach((option) => {
  option.addEventListener("click", () => {
    quizOptions.forEach((item) => {
      item.classList.remove("correct", "wrong");
    });

    if (option.dataset.answer === "correct") {
      option.classList.add("correct");
      quizFeedback.textContent =
        "Correct! A leaf node contains the final prediction.";
      quizFeedback.style.color = "#16845b";
    } else {
      option.classList.add("wrong");
      quizFeedback.textContent =
        "Not quite. Try again—the answer is the endpoint of the tree.";
      quizFeedback.style.color = "#c13d53";
    }
  });
});

document.getElementById("quizReset").addEventListener("click", () => {
  quizOptions.forEach((option) => {
    option.classList.remove("correct", "wrong");
  });

  quizFeedback.textContent = "";
});
