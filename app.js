"use strict";
const examples = {
  choice: {
    question: "What should happen next?",
    rows: [
      ["Ask for fare rules", 0.62],
      ["Quote a change fee", 0.21],
      ["Rebook the flight", 0.17],
    ],
  },
  noul: {
    question: "Are the fare rules available?",
    rows: [
      ["True", 0.08],
      ["False", 0.92],
    ],
  },
  score: {
    question: "How complete is the information for rebooking?",
    rows: [
      ["0 · Incomplete", 0.7],
      ["1 · Partially complete", 0.25],
      ["2 · Complete", 0.05],
    ],
    showExpectation: true,
  },
};
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach((item) => {
    item.setAttribute("aria-selected", String(item === tab));
    item.tabIndex = item === tab ? 0 : -1;
  });
  const example = examples[tab.dataset.kind];
  const panel = document.getElementById("decision-panel");
  panel.setAttribute("aria-labelledby", tab.id);
  document.getElementById("question").textContent = example.question;
  const results = document.getElementById("results");
  results.replaceChildren();
  for (const [name, value] of example.rows) {
    const row = document.createElement("div");
    row.className = "result";
    const line = document.createElement("div");
    line.className = "result-line";
    const label = document.createElement("span");
    label.textContent = name;
    const probability = document.createElement("span");
    probability.className = "value";
    probability.textContent = value.toFixed(2);
    line.append(label, probability);
    const track = document.createElement("div");
    track.className = "track";
    track.setAttribute("aria-hidden", "true");
    const bar = document.createElement("span");
    bar.style.setProperty("--width", `${value * 100}%`);
    track.append(bar);
    row.append(line, track);
    results.append(row);
  }
  const expectation = document.getElementById("expectation");
  const expectedPosition = example.rows.reduce(
    (sum, row, index) => sum + index * row[1],
    0,
  );
  expectation.textContent = example.showExpectation
    ? `Expected position: ${expectedPosition.toFixed(2)} on a 0–${example.rows.length - 1} scale. Computed in code.`
    : "";
  expectation.hidden = !example.showExpectation;
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      tabs[next].focus();
      selectTab(tabs[next]);
    }
  });
});
if (tabs.length) selectTab(tabs[0]);
document.querySelectorAll("[data-copy]").forEach((button) => {
  button.hidden = false;
  button.addEventListener("click", async () => {
    const text = document.getElementById(button.dataset.copy).textContent;
    try {
      await navigator.clipboard.writeText(text);
      document.getElementById("copy-status").textContent = "Checksum copied.";
      button.textContent = "Copied";
    } catch {
      document.getElementById("copy-status").textContent =
        "Clipboard unavailable. Select and copy the checksum text.";
    }
  });
});
