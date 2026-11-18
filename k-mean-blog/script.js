
const canvas = document.getElementById("clusterCanvas");
const ctx = canvas.getContext("2d");
const slider = document.getElementById("kRange");
const kValue = document.getElementById("kValue");
const legend = document.getElementById("legend");
const demoNote = document.getElementById("demoNote");

const colors = ["#2463eb", "#8b5cf6", "#10b981", "#f59e0b", "#ef476f"];

// Fixed sample data makes slider changes easy to compare.
const points = [];
const groups = [
  { x: 0.22, y: 0.25 },
  { x: 0.73, y: 0.28 },
  { x: 0.49, y: 0.73 },
  { x: 0.18, y: 0.76 },
  { x: 0.82, y: 0.72 }
];

groups.forEach((group, groupIndex) => {
  for (let i = 0; i < 16; i++) {
    const angle = i * 2.399 + groupIndex;
    const radius = 0.025 + (i % 5) * 0.009;
    points.push({
      x: Math.max(0.04, Math.min(0.96, group.x + Math.cos(angle) * radius)),
      y: Math.max(0.05, Math.min(0.95, group.y + Math.sin(angle) * radius))
    });
  }
});

function distanceSquared(a, b) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function runKMeans(k) {
  // Deterministic initial centers selected from sample points.
  let centers = Array.from({ length: k }, (_, i) =>
    ({ ...points[Math.floor(i * points.length / k)] })
  );
  let labels = new Array(points.length).fill(0);

  for (let iteration = 0; iteration < 50; iteration++) {
    // Assign each point to its nearest centroid.
    labels = points.map(point => {
      let best = 0;
      let bestDistance = Infinity;

      centers.forEach((center, index) => {
        const d = distanceSquared(point, center);
        if (d < bestDistance) {
          bestDistance = d;
          best = index;
        }
      });

      return best;
    });

    // Recalculate centroid means.
    const updated = centers.map((center, index) => {
      const members = points.filter((point, i) => labels[i] === index);

      if (members.length === 0) return center;

      return {
        x: members.reduce((sum, p) => sum + p.x, 0) / members.length,
        y: members.reduce((sum, p) => sum + p.y, 0) / members.length
      };
    });

    const movement = centers.reduce(
      (sum, center, i) => sum + distanceSquared(center, updated[i]), 0
    );

    centers = updated;
    if (movement < 0.0000001) break;
  }

  // Reassign points against the final centers.
  labels = points.map(point => {
    let best = 0;
    let bestDistance = Infinity;

    centers.forEach((center, index) => {
      const d = distanceSquared(point, center);
      if (d < bestDistance) {
        bestDistance = d;
        best = index;
      }
    });

    return best;
  });

  return { centers, labels };
}

function draw() {
  const k = Number(slider.value);
  kValue.textContent = k;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const padding = { left: 32, right: 16, top: 16, bottom: 29 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const px = x => padding.left + x * plotWidth;
  const py = y => padding.top + y * plotHeight;

  // Light graph grid.
  ctx.strokeStyle = "#e9eff9";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 5; i++) {
    const x = padding.left + plotWidth * i / 5;
    const y = padding.top + plotHeight * i / 5;

    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  const result = runKMeans(k);

  // Plot the assigned points.
  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(px(point.x), py(point.y), 4.3, 0, Math.PI * 2);
    ctx.fillStyle = colors[result.labels[index]];
    ctx.fill();
  });

  // Draw centroids as large X symbols.
  result.centers.forEach((center, index) => {
    const x = px(center.x);
    const y = py(center.y);

    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.strokeStyle = colors[index];
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 6);
    ctx.lineTo(x + 6, y + 6);
    ctx.moveTo(x + 6, y - 6);
    ctx.lineTo(x - 6, y + 6);
    ctx.stroke();
  });

  legend.innerHTML = "";

  for (let i = 0; i < k; i++) {
    const item = document.createElement("span");
    const dot = document.createElement("i");
    dot.style.backgroundColor = colors[i];
    item.appendChild(dot);
    item.appendChild(document.createTextNode(`Cluster ${i + 1}`));
    legend.appendChild(item);
  }

  demoNote.textContent =
    `K = ${k}: the algorithm has grouped ${points.length} sample points into ${k} clusters. ` +
    "Each centroid is calculated from the points assigned to its cluster.";
}

slider.addEventListener("input", draw);

document.getElementById("resetBtn").addEventListener("click", () => {
  slider.value = 3;
  draw();
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  const code = document.getElementById("pythonCode").textContent;
  const button = document.getElementById("copyBtn");

  try {
    await navigator.clipboard.writeText(code);
    button.textContent = "Copied!";
    setTimeout(() => button.textContent = "Copy code", 1500);
  } catch {
    button.textContent = "Select code to copy";
  }
});

if ("ResizeObserver" in window) {
  new ResizeObserver(draw).observe(canvas.parentElement);
} else {
  window.addEventListener("resize", draw);
}

draw();
