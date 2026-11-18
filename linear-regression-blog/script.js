
"use strict";

// ---------- MOBILE NAVIGATION ----------
const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");

menuToggle.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// ---------- TOAST MESSAGE ----------
const toast = document.getElementById("toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// ---------- COPY PYTHON CODE ----------
async function copyText(text, successMessage) {
  try {
    // Works on localhost and secure browser contexts.
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for browsers where Clipboard API is unavailable.
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();

      const copied = document.execCommand("copy");
      textarea.remove();

      if (!copied) {
        throw new Error("Copy command was unsuccessful");
      }
    }

    showToast(successMessage);
  } catch (error) {
    showToast("Copy failed. Please select and copy the text manually.");
  }
}

document.getElementById("copyCode").addEventListener("click", () => {
  const code = document.getElementById("pythonCode").textContent;
  copyText(code, "Python code copied!");
});

document.getElementById("copyOutput").addEventListener("click", () => {
  const output = document.getElementById("pythonOutput").textContent;
  copyText(output, "Output copied!");
});

// ---------- QUIZ ----------
const quizOptions = document.querySelectorAll(".quiz-option");
const quizFeedback = document.getElementById("quizFeedback");

quizOptions.forEach((option) => {
  option.addEventListener("click", () => {
    quizOptions.forEach((item) => {
      item.classList.remove("correct-answer", "wrong-answer");
    });

    if (option.dataset.answer === "correct") {
      option.classList.add("correct-answer");
      quizFeedback.textContent =
        "Correct! Linear Regression predicts numerical values.";
      quizFeedback.style.color = "#15803d";
    } else {
      option.classList.add("wrong-answer");
      quizFeedback.textContent =
        "Not quite. Try again! Think about marks, prices and sales.";
      quizFeedback.style.color = "#dc2626";
    }
  });
});

// ---------- COPYRIGHT YEAR ----------
document.getElementById("year").textContent =
  new Date().getFullYear();

// ---------- LINEAR REGRESSION GRAPH ----------
const canvas = document.getElementById("regressionChart");
const ctx = canvas.getContext("2d");

const studyHours = [1, 2, 3, 4, 5];
const marks = [30, 40, 50, 60, 70];

function drawRegressionGraph() {
  // Support high-resolution screens and responsive resizing.
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const pixelRatio = window.devicePixelRatio || 1;

  if (!width || !height) return;

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Plot margins leave room for axis labels.
  const left = 48;
  const right = 18;
  const top = 20;
  const bottom = 43;

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const xMin = 0;
  const xMax = 6;
  const yMin = 0;
  const yMax = 100;

  const xPosition = (x) =>
    left + ((x - xMin) / (xMax - xMin)) * plotWidth;

  const yPosition = (y) =>
    top + plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;

  // Draw grid lines and axis tick labels.
  ctx.font = "12px Arial";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#e7edf5";
  ctx.fillStyle = "#667085";

  for (let y = 0; y <= 100; y += 20) {
    const py = yPosition(y);

    ctx.beginPath();
    ctx.moveTo(left, py);
    ctx.lineTo(width - right, py);
    ctx.stroke();

    ctx.fillText(String(y), left - 9, py);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (let x = 0; x <= 6; x++) {
    const px = xPosition(x);

    ctx.beginPath();
    ctx.moveTo(px, top);
    ctx.lineTo(px, height - bottom);
    ctx.stroke();

    ctx.fillText(String(x), px, height - bottom + 9);
  }

  // Draw the regression line: predicted marks = 20 + 10x.
  ctx.beginPath();
  ctx.moveTo(xPosition(0), yPosition(20));
  ctx.lineTo(xPosition(6), yPosition(80));
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();

  // Draw the actual observations.
  studyHours.forEach((hour, index) => {
    ctx.beginPath();
    ctx.arc(
      xPosition(hour),
      yPosition(marks[index]),
      5,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "#2563eb";
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Axis labels.
  ctx.fillStyle = "#344054";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Study Hours (X)", left + plotWidth / 2, height - 5);

  ctx.save();
  ctx.translate(14, top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Marks (Y)", 0, 0);
  ctx.restore();
}

// Redraw when the canvas size changes.
if ("ResizeObserver" in window) {
  const graphObserver = new ResizeObserver(drawRegressionGraph);
  graphObserver.observe(canvas);
} else {
  window.addEventListener("resize", drawRegressionGraph);
}

drawRegressionGraph();
