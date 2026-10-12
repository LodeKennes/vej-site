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

// Signup forms: save only after the server confirms a database write.
(() => {
  const SITE_KEY = "0x4AAAAAAFUX432RgVYn0q-y";
  const ENDPOINT = "https://forms.itsvej.com/submit";
  let challengePromise;
  function loadChallenge() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (challengePromise) return challengePromise;
    challengePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      const fail = () => {
        clearTimeout(timer);
        script.remove();
        challengePromise = null;
        reject(new Error("Browser check unavailable"));
      };
      const timer = setTimeout(fail, 15000);
      script.onerror = fail;
      script.onload = () => { clearTimeout(timer); resolve(window.turnstile); };
      document.head.append(script);
    });
    return challengePromise;
  }
  document.querySelectorAll("[data-signup-form]").forEach((form) => {
    const button = form.querySelector('button[type="submit"]');
    const retry = form.querySelector("[data-retry]");
    const feedback = form.querySelector(".form-feedback");
    const label = button.textContent;
    let token = "";
    let widget;
    let submitting = false;
    function checkFailed(message) {
      token = "";
      button.disabled = true;
      retry.hidden = false;
      if (!submitting && form.dataset.state !== "success") { feedback.textContent = message; form.dataset.state = "error"; }
    }
    async function prepare() {
      retry.hidden = true;
      feedback.textContent = "Checking your browser.";
      form.dataset.state = "checking";
      try {
        const challenge = await loadChallenge();
        if (widget !== undefined) { challenge.reset(widget); return; }
        widget = challenge.render(form.querySelector("[data-turnstile]"), {
          sitekey: SITE_KEY, action: form.dataset.kind, size: "compact", appearance: "interaction-only",
          callback: (value) => {
            token = value;
            button.disabled = submitting;
            retry.hidden = true;
            if (form.dataset.state === "checking") { feedback.textContent = ""; form.dataset.state = "idle"; }
          },
          "expired-callback": () => checkFailed("The browser check expired. Please retry it."),
          "error-callback": () => checkFailed("The browser check failed. Please retry it or email hello@itsvej.com."),
          "timeout-callback": () => checkFailed("The browser check timed out. Please retry it."),
        });
      } catch {
        checkFailed("The form could not load. Please retry the browser check or email hello@itsvej.com.");
      }
    }
    retry.addEventListener("click", prepare);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitting || !form.reportValidity()) return;
      if (!token) { checkFailed("Complete the browser check, then try again."); return; }
      const fields = new FormData(form);
      const data = {
        kind: form.dataset.kind, email: fields.get("email"), name: fields.get("name") || "",
        company: fields.get("company") || "", website: fields.get("website") || "",
        consent: fields.get("consent") === "on", token,
      };
      const controls = [...form.querySelectorAll("input, button")];
      submitting = true;
      controls.forEach(control => { control.disabled = true; });
      form.setAttribute("aria-busy", "true");
      form.dataset.state = "submitting";
      button.textContent = "Sending…";
      feedback.textContent = "Saving your request.";
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      let failure;
      try {
        const response = await fetch(ENDPOINT, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit",
          body: JSON.stringify(data), signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || result.ok !== true) {
          failure = typeof result.message === "string" ? result.message : null;
          throw new Error("Not saved");
        }
        form.reset();
        form.dataset.state = "success";
        feedback.textContent = {
          pea_access: "Pea access request saved. We will review it and contact you.",
          pepper_waitlist: "You are on the Pepper waitlist.",
          pumpkin_waitlist: "You are on the Pumpkin waitlist.",
          newsletter: "You are subscribed to Vej updates.",
        }[form.dataset.kind];
      } catch {
        form.dataset.state = "error";
        feedback.textContent = failure || "We could not save the form. Your details are still here. Please try again.";
      } finally {
        clearTimeout(timer);
        submitting = false;
        controls.forEach(control => { control.disabled = false; });
        form.removeAttribute("aria-busy");
        button.textContent = label;
        token = "";
        button.disabled = true;
        if (widget !== undefined) window.turnstile.reset(widget);
      }
    });
    // Cancel native submission before the browser check can enable this button.
    prepare();
  });
})();

// Keep the model dropdown keyboard friendly without changing its link-based navigation.
document.querySelectorAll(".evaluation-switcher details").forEach((dropdown) => {
  dropdown.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dropdown.open) {
      dropdown.open = false;
      dropdown.querySelector("summary").focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) dropdown.open = false;
  });
});

// Page motion: enhance native navigation without delaying it or hiding content.
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const animations = new Set();
  function enter(element, delay = 0) {
    if (reducedMotion.matches || !element.animate) return;
    const animation = element.animate(
      [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
      { duration: 480, delay, fill: "backwards", easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    animations.add(animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(animation));
  }
  function intro(event) {
    // The native page transition already animates arrivals from another page.
    if (event?.viewTransition || performance.getEntriesByType("navigation")[0]?.type === "back_forward") return;
    document.querySelectorAll(".hero > :first-child, .hero > .decision, .page-hero").forEach((element, index) => enter(element, index * 70));
  }
  if ("PageRevealEvent" in window) {
    window.addEventListener("pagereveal", intro, { once: true });
  } else {
    requestAnimationFrame(() => intro());
  }
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (entry.target.getBoundingClientRect().top >= 0) enter(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".model-card, .section-head").forEach((element) => {
      // Leave the first viewport and direct fragment destinations visible immediately.
      if (element.getBoundingClientRect().top >= window.innerHeight) observer.observe(element);
    });
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) observer.disconnect();
    });
  }
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) animations.forEach((animation) => animation.cancel());
  });

  const indicator = document.createElement("div");
  indicator.className = "page-loading";
  indicator.setAttribute("aria-hidden", "true");
  const status = document.createElement("div");
  status.className = "sr-only";
  status.setAttribute("role", "status");
  document.body.append(indicator, status);
  let loadingTimer;
  let recoveryTimer;
  function resetLoading() {
    clearTimeout(loadingTimer);
    clearTimeout(recoveryTimer);
    document.documentElement.classList.remove("is-navigating");
    status.textContent = "";
  }
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !/\/$|\.html$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    resetLoading();
    // Fast pages need no spinner; this is an indeterminate wait indicator, not a percentage.
    loadingTimer = setTimeout(() => {
      document.documentElement.classList.add("is-navigating");
      status.textContent = "Loading page.";
    }, 180);
    // Recover if navigation is cancelled or the destination does not respond.
    recoveryTimer = setTimeout(resetLoading, 10000);
  });
  window.addEventListener("pageshow", resetLoading);
  window.addEventListener("pagehide", resetLoading);
})();
