
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const toast = document.getElementById("toast");

// Mobile navigation
menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
  menuToggle.textContent = navLinks.classList.contains("open") ? "✕" : "☰";
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.textContent = "☰";
  });
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Toast notification
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// Copy Python code and sample output
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();

      const copied = document.execCommand("copy");
      textarea.remove();

      if (!copied) throw new Error("Copy failed");
    }

    showToast("Copied to clipboard!");
  } catch (error) {
    showToast("Copy failed. Please select and copy the text manually.");
  }
}

document.querySelectorAll("[data-copy]").forEach(button => {
  button.addEventListener("click", () => {
    const element = document.getElementById(button.dataset.copy);
    if (element) copyText(element.textContent);
  });
});

// Interactive probability calculator
const probabilitySlider = document.getElementById("probabilitySlider");
const probabilityValue = document.getElementById("probabilityValue");
const thresholdSelect = document.getElementById("thresholdSelect");
const predictedClass = document.getElementById("predictedClass");
const predictionResult = document.getElementById("predictionResult");
const resultIcon = predictionResult.querySelector(".result-icon");

function updatePrediction() {
  const probability = Number(probabilitySlider.value) / 100;
  const threshold = Number(thresholdSelect.value);

  probabilityValue.textContent = `${Math.round(probability * 100)}%`;

  if (probability >= threshold) {
    predictedClass.textContent = "Pass (Class 1)";
    resultIcon.textContent = "✓";
    predictionResult.style.background = "#dcfce7";
    resultIcon.style.background = "#bbf7d0";
    resultIcon.style.color = "#166534";
  } else {
    predictedClass.textContent = "Fail (Class 0)";
    resultIcon.textContent = "×";
    predictionResult.style.background = "#fee2e2";
    resultIcon.style.background = "#fecaca";
    resultIcon.style.color = "#991b1b";
  }
}

probabilitySlider.addEventListener("input", updatePrediction);
thresholdSelect.addEventListener("change", updatePrediction);
updatePrediction();

// Interactive quiz
const quizOptions = document.querySelectorAll(".quiz-option");
const quizFeedback = document.getElementById("quizFeedback");

quizOptions.forEach(option => {
  option.addEventListener("click", () => {
    quizOptions.forEach(item => {
      item.classList.remove("correct-choice", "wrong-choice");
    });

    if (option.dataset.answer === "correct") {
      option.classList.add("correct-choice");
      quizFeedback.textContent =
        "Correct! The sigmoid function converts the model score into a probability between 0 and 1.";
      quizFeedback.style.color = "#86efac";
    } else {
      option.classList.add("wrong-choice");
      quizFeedback.textContent =
        "Not quite. Try again! Look for the function used to calculate logistic probabilities.";
      quizFeedback.style.color = "#fca5a5";
    }
  });
});

// Draw the sigmoid graph
function drawSigmoidGraph() {
  const canvas = document.getElementById("sigmoidCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();

  if (rect.width === 0) return;

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = rect.width * pixelRatio;
  canvas.height = rect.height * pixelRatio;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const left = 43;
  const right = 14;
  const top = 17;
  const bottom = 34;
  const graphWidth = width - left - right;
  const graphHeight = height - top - bottom;

  ctx.clearRect(0, 0, width, height);
  ctx.font = "11px Arial";
  ctx.lineWidth = 1;

  // Coordinate mapping
  const xPos = x => left + ((x + 6) / 12) * graphWidth;
  const yPos = y => top + (1 - y) * graphHeight;

  // Grid lines and axis labels
  ctx.strokeStyle = "#e8edf5";
  ctx.fillStyle = "#64748b";

  for (let y = 0; y <= 1.001; y += 0.25) {
    ctx.beginPath();
    ctx.moveTo(left, yPos(y));
    ctx.lineTo(width - right, yPos(y));
    ctx.stroke();

    ctx.textAlign = "right";
    ctx.fillText(y.toFixed(2), left - 8, yPos(y) + 4);
  }

  for (let x = -6; x <= 6; x += 2) {
    ctx.beginPath();
    ctx.moveTo(xPos(x), top);
    ctx.lineTo(xPos(x), height - bottom);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillText(String(x), xPos(x), height - bottom + 18);
  }

  // Threshold at probability 0.5
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(left, yPos(0.5));
  ctx.lineTo(width - right, yPos(0.5));
  ctx.stroke();
  ctx.restore();

  // Sigmoid curve: 1 / (1 + e^(-x))
  ctx.beginPath();
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 3;

  for (let i = 0; i <= 300; i++) {
    const x = -6 + (12 * i) / 300;
    const y = 1 / (1 + Math.exp(-x));

    if (i === 0) {
      ctx.moveTo(xPos(x), yPos(y));
    } else {
      ctx.lineTo(xPos(x), yPos(y));
    }
  }

  ctx.stroke();

  // Axis titles
  ctx.fillStyle = "#475569";
  ctx.textAlign = "center";
  ctx.fillText("Model score (z)", left + graphWidth / 2, height - 4);
}

window.addEventListener("load", drawSigmoidGraph);

if ("ResizeObserver" in window) {
  const canvas = document.getElementById("sigmoidCanvas");
  const observer = new ResizeObserver(drawSigmoidGraph);
  observer.observe(canvas);
} else {
  window.addEventListener("resize", drawSigmoidGraph);
}
