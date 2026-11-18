
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

// KNN teaching dataset: [feature 1, feature 2, class]
const points = [
  { x: 2, y: 7, label: "A" },
  { x: 3, y: 6, label: "A" },
  { x: 3, y: 8, label: "A" },
  { x: 4, y: 5, label: "A" },
  { x: 7, y: 7, label: "B" },
  { x: 8, y: 5, label: "B" },
  { x: 8, y: 8, label: "B" }
];

const queryPoint = { x: 5, y: 6.4 };

const canvas = document.getElementById("knnCanvas");
const ctx = canvas.getContext("2d");
const kSlider = document.getElementById("kSlider");
const kNumber = document.getElementById("kNumber");
const predictedClass = document.getElementById("predictedClass");
const voteExplanation = document.getElementById("voteExplanation");
const voteBarA = document.getElementById("voteBarA");
const voteBarB = document.getElementById("voteBarB");
const countA = document.getElementById("countA");
const countB = document.getElementById("countB");

const COLORS = {
  A: "#3267e9",
  B: "#e99542",
  navy: "#102344",
  grid: "#e8eef8",
  muted: "#7c8ba4"
};

function getNearestNeighbors(k) {
  return points
    .map((point, index) => ({
      ...point,
      index,
      distance: Math.hypot(
        point.x - queryPoint.x,
        point.y - queryPoint.y
      )
    }))
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .slice(0, k);
}

function drawChart(neighbors) {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  if (!width || !height) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfcff";
  ctx.fillRect(0, 0, width, height);

  const pad = { left: 38, right: 15, top: 18, bottom: 32 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;

  function mapX(x) {
    return pad.left + (x / 10) * plotWidth;
  }

  function mapY(y) {
    return pad.top + ((10 - y) / 10) * plotHeight;
  }

  // Grid and axis labels
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = COLORS.muted;
  ctx.font = "10px sans-serif";

  for (let i = 0; i <= 10; i += 2) {
    const x = mapX(i);
    const y = mapY(i);

    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, height - pad.bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillText(String(i), x, height - 12);

    ctx.textAlign = "right";
    ctx.fillText(String(i), pad.left - 8, y + 3);
  }

  // Highlight selected neighbors and show distance links
  neighbors.forEach((neighbor) => {
    const x1 = mapX(queryPoint.x);
    const y1 = mapY(queryPoint.y);
    const x2 = mapX(neighbor.x);
    const y2 = mapY(neighbor.y);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = neighbor.label === "A" ? "#3267e97a" : "#e995427a";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(x2, y2, 12, 0, Math.PI * 2);
    ctx.fillStyle = neighbor.label === "A" ? "#3267e91b" : "#e995421b";
    ctx.fill();
  });

  // Draw all training examples
  points.forEach((point) => {
    const x = mapX(point.x);
    const y = mapY(point.y);
    const isNeighbor = neighbors.some((n) => n.index === points.indexOf(point));

    ctx.beginPath();
    ctx.arc(x, y, isNeighbor ? 7 : 5.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS[point.label];
    ctx.fill();

    if (isNeighbor) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  // Draw the new point
  const qx = mapX(queryPoint.x);
  const qy = mapY(queryPoint.y);

  ctx.beginPath();
  ctx.arc(qx, qy, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = COLORS.navy;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = COLORS.navy;
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = qx > width * 0.65 ? "right" : "left";
  ctx.fillText("New point", qx + (qx > width * 0.65 ? -14 : 14), qy - 12);
}

function updateKNN() {
  const k = Number(kSlider.value);
  const neighbors = getNearestNeighbors(k);

  const a = neighbors.filter((point) => point.label === "A").length;
  const b = neighbors.filter((point) => point.label === "B").length;
  const winner = a >= b ? "A" : "B";

  kNumber.textContent = k;
  predictedClass.textContent = `Class ${winner}`;
  predictedClass.style.color = COLORS[winner];

  voteExplanation.textContent =
    `${Math.max(a, b)} of the ${k} nearest neighbors belong to Class ${winner}.`;

  voteBarA.style.width = `${(a / k) * 100}%`;
  voteBarB.style.width = `${(b / k) * 100}%`;

  countA.textContent = `Class A: ${a}`;
  countB.textContent = `Class B: ${b}`;

  drawChart(neighbors);
}

kSlider.addEventListener("input", updateKNN);

document.getElementById("kMinus").addEventListener("click", () => {
  kSlider.value = Math.max(1, Number(kSlider.value) - 1);
  updateKNN();
});

document.getElementById("kPlus").addEventListener("click", () => {
  kSlider.value = Math.min(7, Number(kSlider.value) + 1);
  updateKNN();
});

document.getElementById("resetK").addEventListener("click", () => {
  kSlider.value = 3;
  updateKNN();
});

window.addEventListener("resize", updateKNN);

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

    try {
      await navigator.clipboard.writeText(target.innerText);
      showToast("Copied to clipboard!");
    } catch (error) {
      const temp = document.createElement("textarea");
      temp.value = target.innerText;
      temp.style.position = "fixed";
      temp.style.opacity = "0";
      document.body.appendChild(temp);
      temp.select();

      try {
        document.execCommand("copy");
        showToast("Copied to clipboard!");
      } catch (copyError) {
        showToast("Please select and copy the text.");
      }

      temp.remove();
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
        "Correct! KNN classification commonly uses a majority vote of the nearest neighbors.";
      quizFeedback.style.color = "#16845b";
    } else {
      option.classList.add("wrong");
      quizFeedback.textContent =
        "Not quite. Think about how the closest data points vote on the new point's class.";
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

// Initial render
updateKNN();
