
const colors = ["#2878ff", "#21b875", "#ff9b35"];

const variance = [73.0, 22.8, 3.1, 1.1];

const slider = document.getElementById("components");

function drawScatter(canvasId, mode, componentCount = 2) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;

  ctx.clearRect(0, 0, width, height);

  const pad = { left: 27, right: 12, top: 12, bottom: 25 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;

  const dark = mode === "hero";

  // Draw grid lines
  ctx.strokeStyle = dark ? "#294b80" : "#e7edfb";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const x = pad.left + plotWidth * i / 4;
    const y = pad.top + plotHeight * i / 4;

    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotWidth, y);
    ctx.stroke();
  }

  const originalCenters = [
    [0.27, 0.64],
    [0.53, 0.28],
    [0.72, 0.65]
  ];

  const reducedCenters = [
    [0.24, 0.48],
    [0.68, 0.29],
    [0.52, 0.76]
  ];

  const centers = mode === "original"
    ? originalCenters
    : reducedCenters;

  const pointCount = dark ? 38 : 55;

  // Draw three illustrative groups
  for (let group = 0; group < 3; group++) {
    for (let i = 0; i < pointCount; i++) {
      const randomX = Math.sin(
        (i + 1) * 12.9898 + (group + 1) * 78.233
      ) * 43758.5453;

      const randomY = Math.sin(
        (i + 7) * 39.3467 + (group + 2) * 11.135
      ) * 96321.213;

      const dx = (randomX - Math.floor(randomX) - 0.5)
        * (mode === "original" ? 0.24 : 0.19);

      const dy = (randomY - Math.floor(randomY) - 0.5)
        * (mode === "original" ? 0.22 : 0.20);

      let cx = centers[group][0];
      let cy = centers[group][1];

      if (mode === "reduced" && componentCount === 1) {
        cx = 0.18 + group * 0.31 + dx * 0.5;
        cy = 0.5 + dy * 0.28;
      } else if (mode === "reduced" && componentCount === 3) {
        cx += dx * 1.2;
        cy += dy * 1.2;
      } else {
        cx += dx;
        cy += dy;
      }

      const x = pad.left + cx * plotWidth;
      const y = pad.top + cy * plotHeight;

      ctx.beginPath();
      ctx.arc(x, y, dark ? 2.3 : 2.6, 0, Math.PI * 2);
      ctx.fillStyle = colors[group];
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Axis labels
  ctx.fillStyle = dark ? "#c6d9ff" : "#6e7d9b";
  ctx.font = "10px Arial";

  ctx.fillText(
    mode === "original" ? "Feature 1" : "PC 1",
    pad.left + plotWidth / 2 - 18,
    height - 4
  );

  ctx.save();
  ctx.translate(10, pad.top + plotHeight / 2 + 14);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(
    mode === "original" ? "Feature 2" : "PC 2",
    0,
    0
  );
  ctx.restore();
}

function updateDemo() {
  const count = Number(slider.value);

  document.getElementById("componentValue").textContent = count;
  document.getElementById("chartComponentCount").textContent = count;

  const retained = variance
    .slice(0, count)
    .reduce((total, value) => total + value, 0);

  document.getElementById("varianceValue").textContent =
    retained.toFixed(1) + "%";

  const caption = document.getElementById("afterCaption");

  if (count === 1) {
    caption.textContent =
      "One component is compact, but more variation is lost.";
  } else if (count === 4) {
    caption.textContent =
      "All four components retain all measured variance.";
  } else {
    caption.textContent =
      "Two components make the data easier to visualize.";
  }

  // Show the illustrative contribution of each component
  const bars = document.getElementById("varianceBars");

  bars.innerHTML = variance.map((value, index) => `
    <div class="variance-bar">
      PC${index + 1}
      <strong>${value.toFixed(1)}%</strong>
    </div>
  `).join("");

  drawScatter("afterChart", "reduced", count);
}

document.getElementById("copyCode").addEventListener("click", async () => {
  const code = document.getElementById("pythonCode").innerText;
  const button = document.getElementById("copyCode");

  try {
    await navigator.clipboard.writeText(code);
    button.textContent = "Copied ✓";
  } catch (error) {
    button.textContent = "Select code to copy";
  }

  setTimeout(() => {
    button.textContent = "Copy Code";
  }, 1800);
});

slider.addEventListener("input", updateDemo);

function renderAll() {
  drawScatter("heroOriginal", "original", 2);
  drawScatter("heroReduced", "reduced", 2);
  drawScatter("beforeChart", "original", 4);
  updateDemo();
}

window.addEventListener("resize", renderAll);

renderAll();
