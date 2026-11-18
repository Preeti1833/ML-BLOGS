
const palette = [
  "#3574ed", "#875ce8", "#18a77a", "#f09a39",
  "#ec5876", "#19a8b8", "#b17a36"
];

const points = [
  { x: 1.0, y: 1.5 }, { x: 1.4, y: 1.0 },
  { x: 1.7, y: 1.8 }, { x: 2.1, y: 1.3 },
  { x: 4.8, y: 7.0 }, { x: 5.4, y: 7.8 },
  { x: 6.1, y: 7.1 }, { x: 5.7, y: 6.5 },
  { x: 8.0, y: 2.0 }, { x: 8.7, y: 2.8 },
  { x: 9.4, y: 2.1 }, { x: 8.8, y: 1.5 }
];

const linkageSelect = document.getElementById("linkage");
const clusterSlider = document.getElementById("clusterCount");
const clusterValue = document.getElementById("clusterValue");
const dendrogramCanvas = document.getElementById("dendrogram");
const scatterCanvas = document.getElementById("scatter");
const statusText = document.getElementById("demoStatus");
const legend = document.getElementById("demoLegend");

function euclidean(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function centroid(items) {
  return {
    x: items.reduce((s, p) => s + p.x, 0) / items.length,
    y: items.reduce((s, p) => s + p.y, 0) / items.length
  };
}

function clusterDistance(a, b, method) {
  const distances = [];

  for (const p of a.points) {
    for (const q of b.points) {
      distances.push(euclidean(p, q));
    }
  }

  if (method === "single") return Math.min(...distances);
  if (method === "complete") return Math.max(...distances);

  if (method === "ward") {
    // Ward distance: increase in within-cluster sum of squares.
    const ca = centroid(a.points);
    const cb = centroid(b.points);
    return Math.sqrt(
      (2 * a.points.length * b.points.length) /
      (a.points.length + b.points.length)
    ) * euclidean(ca, cb);
  }

  return distances.reduce((sum, d) => sum + d, 0) / distances.length;
}

function buildHierarchy(method) {
  let clusters = points.map((point, index) => ({
    id: index,
    points: [point],
    leaves: [index],
    height: 0
  }));

  const merges = [];
  let nextId = points.length;

  while (clusters.length > 1) {
    let bestI = 0;
    let bestJ = 1;
    let bestDistance = Infinity;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = clusterDistance(clusters[i], clusters[j], method);
        if (d < bestDistance) {
          bestDistance = d;
          bestI = i;
          bestJ = j;
        }
      }
    }

    const a = clusters[bestI];
    const b = clusters[bestJ];

    const merged = {
      id: nextId++,
      left: a,
      right: b,
      points: [...a.points, ...b.points],
      leaves: [...a.leaves, ...b.leaves],
      height: bestDistance
    };

    merges.push(merged);
    clusters = clusters.filter((_, i) => i !== bestI && i !== bestJ);
    clusters.push(merged);
  }

  return { root: clusters[0], merges };
}

function cutHierarchy(merges, k) {
  let clusters = points.map((point, index) => ({
    id: index,
    points: [point],
    leaves: [index]
  }));

  for (const merge of merges.slice(0, points.length - k)) {
    clusters = clusters.filter(
      cluster => cluster.id !== merge.left.id && cluster.id !== merge.right.id
    );
    clusters.push({
      id: merge.id,
      points: merge.points,
      leaves: merge.leaves
    });
  }

  const labels = new Array(points.length).fill(0);
  clusters.forEach((cluster, label) => {
    cluster.leaves.forEach(index => {
      labels[index] = label;
    });
  });

  return { clusters, labels };
}

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(100, rect.width);
  const height = Math.max(100, rect.height);
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  return { ctx, width, height };
}

function drawDendrogram(root, merges, k) {
  const { ctx, width, height } = setupCanvas(dendrogramCanvas);
  const margin = { left: 40, right: 12, top: 20, bottom: 38 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const maxHeight = Math.max(...merges.map(m => m.height), 1) * 1.12;

  const leafPositions = new Map();
  points.forEach((_, i) => {
    leafPositions.set(i, margin.left + (i + 0.5) * plotW / points.length);
  });

  const coords = new Map();
  points.forEach((_, i) => coords.set(i, {
    x: leafPositions.get(i),
    y: margin.top + plotH
  }));

  const yAt = value => margin.top + plotH - (value / maxHeight) * plotH;

  // Grid and distance labels.
  ctx.font = "10px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= 4; i++) {
    const value = maxHeight * i / 4;
    const y = yAt(value);
    ctx.strokeStyle = "#e8edf7";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(width - margin.right, y);
    ctx.stroke();
    ctx.fillStyle = "#71809d";
    ctx.fillText(value.toFixed(1), margin.left - 7, y);
  }

  // A horizontal cut occurs at the next merge height above the
  // selected cluster count, if such a merge exists.
  const cutMergeIndex = points.length - k;
  let cutHeight;

  if (cutMergeIndex > 0 && cutMergeIndex < merges.length) {
    cutHeight = (merges[cutMergeIndex - 1].height +
                 merges[cutMergeIndex].height) / 2;
  } else if (cutMergeIndex === 0) {
    cutHeight = merges[0].height * 0.48;
  } else {
    cutHeight = merges[merges.length - 1].height * 1.04;
  }

  const cutY = yAt(cutHeight);
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "#ec5876";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin.left, cutY);
  ctx.lineTo(width - margin.right, cutY);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#d74468";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.font = "10px sans-serif";
  ctx.fillText("Cluster cut", margin.left + 5, cutY - 4);

  // Draw each merge in chronological order.
  merges.forEach((merge, mergeIndex) => {
    const left = coords.get(merge.left.id);
    const right = coords.get(merge.right.id);
    const y = yAt(merge.height);

    const color = mergeIndex < points.length - k
      ? palette[mergeIndex % palette.length]
      : "#8b98b2";

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(left.x, y);
    ctx.lineTo(right.x, y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();

    coords.set(merge.id, {
      x: (left.x + right.x) / 2,
      y
    });
  });

  // Leaf labels.
  ctx.fillStyle = "#62718e";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  points.forEach((_, i) => {
    ctx.fillText(`P${i + 1}`, leafPositions.get(i), height - margin.bottom + 9);
  });

  ctx.save();
  ctx.translate(12, margin.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#536584";
  ctx.font = "11px sans-serif";
  ctx.fillText("Merge distance", 0, 0);
  ctx.restore();
}

function drawScatter(labels, k) {
  const { ctx, width, height } = setupCanvas(scatterCanvas);
  const margin = { left: 37, right: 15, top: 18, bottom: 35 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const minX = 0, maxX = 11, minY = 0, maxY = 9;
  const px = x => margin.left + (x - minX) / (maxX - minX) * plotW;
  const py = y => margin.top + plotH - (y - minY) / (maxY - minY) * plotH;

  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (let x = 0; x <= 10; x += 2) {
    const cx = px(x);
    ctx.strokeStyle = "#e8edf7";
    ctx.beginPath();
    ctx.moveTo(cx, margin.top);
    ctx.lineTo(cx, margin.top + plotH);
    ctx.stroke();
    ctx.fillStyle = "#71809d";
    ctx.fillText(x, cx, margin.top + plotH + 8);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let y = 0; y <= 8; y += 2) {
    const cy = py(y);
    ctx.strokeStyle = "#e8edf7";
    ctx.beginPath();
    ctx.moveTo(margin.left, cy);
    ctx.lineTo(margin.left + plotW, cy);
    ctx.stroke();
    ctx.fillStyle = "#71809d";
    ctx.fillText(y, margin.left - 7, cy);
  }

  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(px(point.x), py(point.y), 5.2, 0, Math.PI * 2);
    ctx.fillStyle = palette[labels[index] % palette.length];
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  ctx.fillStyle = "#536584";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = "11px sans-serif";
  ctx.fillText("Feature 1", margin.left + plotW / 2, height - 2);

  ctx.save();
  ctx.translate(11, margin.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Feature 2", 0, 0);
  ctx.restore();
}

function drawHeroTree() {
  const canvas = document.getElementById("heroTree");
  const { ctx, width, height } = setupCanvas(canvas);
  const n = 9;
  const base = height - 12;
  const step = (width - 24) / n;

  const leaves = [];
  for (let i = 0; i < n; i++) {
    leaves.push({ x: 12 + step * (i + 0.5), y: base, height: 0 });
  }

  let current = leaves.map((leaf, i) => ({ ...leaf, id: i }));
  let nextId = n;
  const all = new Map(current.map(item => [item.id, item]));

  const heights = [0.13, 0.17, 0.21, 0.26, 0.32, 0.40, 0.57, 0.82];
  heights.forEach((h, i) => {
    const a = current[i % current.length];
    const b = current[(i + 1) % current.length];
    if (!a || !b || a.id === b.id) return;

    const merged = {
      id: nextId++,
      x: (a.x + b.x) / 2,
      y: base - h * (height - 25),
      height: h,
      left: a,
      right: b
    };

    ctx.strokeStyle = palette[i % 4];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x, merged.y);
    ctx.lineTo(b.x, merged.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    all.set(merged.id, merged);
    current.push(merged);
  });
}

function drawHeroClusters() {
  const canvas = document.getElementById("heroClusters");
  const { ctx, width, height } = setupCanvas(canvas);
  const groups = [
    { x: 0.24, y: 0.28, color: palette[0] },
    { x: 0.72, y: 0.25, color: palette[2] },
    { x: 0.45, y: 0.72, color: palette[3] }
  ];

  groups.forEach((group, g) => {
    for (let i = 0; i < 12; i++) {
      const angle = i * 2.4 + g;
      const r = 0.025 + (i % 4) * 0.014;
      const x = (group.x + Math.cos(angle) * r) * width;
      const y = (group.y + Math.sin(angle) * r) * height;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = group.color;
      ctx.fill();
    }
  });
}

function renderDemo() {
  const k = Number(clusterSlider.value);
  const method = linkageSelect.value;
  clusterValue.textContent = k;

  const { merges, root } = buildHierarchy(method);
  const { labels } = cutHierarchy(merges, k);

  drawDendrogram(root, merges, k);
  drawScatter(labels, k);

  legend.innerHTML = "";
  for (let i = 0; i < k; i++) {
    const item = document.createElement("span");
    const dot = document.createElement("i");
    dot.style.backgroundColor = palette[i % palette.length];
    item.appendChild(dot);
    item.appendChild(document.createTextNode(`Cluster ${i + 1}`));
    legend.appendChild(item);
  }

  const methodName = linkageSelect.options[linkageSelect.selectedIndex].text;
  statusText.textContent =
    `${methodName} with ${k} clusters. The dendrogram shows the merge sequence; ` +
    `the scatter plot colors each point according to the selected cut.`;
}

linkageSelect.addEventListener("change", renderDemo);
clusterSlider.addEventListener("input", renderDemo);

document.getElementById("resetDemo").addEventListener("click", () => {
  linkageSelect.value = "average";
  clusterSlider.value = 3;
  renderDemo();
});

document.getElementById("copyCode").addEventListener("click", async () => {
  const code = document.getElementById("pythonCode").textContent;
  const button = document.getElementById("copyCode");

  try {
    await navigator.clipboard.writeText(code);
    button.textContent = "Copied!";
    setTimeout(() => button.textContent = "Copy code", 1500);
  } catch {
    button.textContent = "Please select the code";
  }
});

function renderAll() {
  drawHeroTree();
  drawHeroClusters();
  renderDemo();
}

if ("ResizeObserver" in window) {
  const observer = new ResizeObserver(() => renderAll());
  observer.observe(document.querySelector(".hero-visual"));
  observer.observe(dendrogramCanvas.parentElement);
  observer.observe(scatterCanvas.parentElement);
} else {
  window.addEventListener("resize", renderAll);
}

renderAll();
