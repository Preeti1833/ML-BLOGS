
const transactions = [
  ["Bread", "Milk"],
  ["Bread", "Butter", "Milk"],
  ["Bread", "Butter"],
  ["Milk", "Butter"],
  ["Bread", "Milk"]
];

const ruleSelect = document.getElementById("ruleSelect");
const supportValue = document.getElementById("supportValue");
const confidenceValue = document.getElementById("confidenceValue");
const liftValue = document.getElementById("liftValue");
const ruleExplanation = document.getElementById("ruleExplanation");

function countContaining(items) {
  return transactions.filter(transaction =>
    items.every(item => transaction.includes(item))
  ).length;
}

function calculateRule(antecedent, consequent) {
  const total = transactions.length;
  const antecedentCount = countContaining([antecedent]);
  const consequentCount = countContaining([consequent]);
  const bothCount = countContaining([antecedent, consequent]);

  const support = bothCount / total;
  const confidence = antecedentCount === 0
    ? 0
    : bothCount / antecedentCount;
  const consequentSupport = consequentCount / total;
  const lift = consequentSupport === 0
    ? 0
    : confidence / consequentSupport;

  return { support, confidence, lift, bothCount, antecedentCount };
}

function updateMetric(barId, value, maximum) {
  const bar = document.getElementById(barId);
  const percentage = Math.max(0, Math.min(100, (value / maximum) * 100));
  bar.style.width = percentage + "%";
}

function updateDemo() {
  const rules = {
    breadButter: ["Bread", "Butter"],
    breadMilk: ["Bread", "Milk"],
    milkBread: ["Milk", "Bread"]
  };

  const [antecedent, consequent] = rules[ruleSelect.value];
  const result = calculateRule(antecedent, consequent);

  supportValue.textContent = (result.support * 100).toFixed(0) + "%";
  confidenceValue.textContent = (result.confidence * 100).toFixed(0) + "%";
  liftValue.textContent = result.lift.toFixed(2);

  updateMetric("supportBar", result.support, 1);
  updateMetric("confidenceBar", result.confidence, 1);
  updateMetric("liftBar", result.lift, 2);

  ruleExplanation.textContent =
    `${antecedent} and ${consequent} occur together in ` +
    `${result.bothCount} of ${transactions.length} transactions. ` +
    `When ${antecedent} appears, ${consequent} also appears in ` +
    `${(result.confidence * 100).toFixed(0)}% of those transactions. ` +
    (result.lift > 1
      ? "The lift suggests a positive association."
      : result.lift < 1
        ? "The lift is below 1, indicating a negative association in this dataset."
        : "The lift is 1, indicating independence in this dataset.");

  renderFrequencyChart();
}

function renderFrequencyChart() {
  const chart = document.getElementById("frequencyChart");
  const items = ["Bread", "Butter", "Milk"];
  const counts = items.map(item => countContaining([item]));
  const maxCount = Math.max(...counts, 1);

  chart.innerHTML = items.map((item, index) => {
    const percentage = (counts[index] / maxCount) * 100;

    return `
      <div class="bar-row">
        <span>${item}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${percentage}%"></div>
        </div>
        <strong>${counts[index]}/${transactions.length}</strong>
      </div>
    `;
  }).join("");
}

ruleSelect.addEventListener("change", updateDemo);

document.getElementById("copyCode").addEventListener("click", async () => {
  const code = document.getElementById("pythonCode").textContent;
  const button = document.getElementById("copyCode");

  try {
    await navigator.clipboard.writeText(code);
    button.textContent = "Copied!";
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
    button.textContent = "Copied!";
  }

  setTimeout(() => {
    button.textContent = "Copy Code";
  }, 1800);
});

updateDemo();
