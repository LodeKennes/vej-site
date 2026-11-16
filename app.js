"use strict";
// Motion kit: the site's shared transitions (site/MOTION.md). Every helper does nothing under reduced motion or
// without the Web Animations API, so content always arrives; motion only shows how it got there.
const motion = (() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const on = () => !reduced.matches && typeof Element.prototype.animate === "function";
  const settle = "cubic-bezier(0.16, 1, 0.3, 1)";
  const leave = "cubic-bezier(0.4, 0, 1, 1)";
  const rect = (el) => ({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
  const px = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  // A selection that slides between items: it stretches across both, then settles on the new one.
  function selection(container, className) {
    const el = document.createElement("span");
    el.className = className;
    el.setAttribute("aria-hidden", "true");
    container.prepend(el);
    let running = null;
    const move = (target) => {
      const to = rect(target);
      const from = el.style.width ? rect(el) : null;
      running?.cancel();
      running = null;
      Object.assign(el.style, px(to));
      if (!on() || !from || (from.left === to.left && from.top === to.top && from.width === to.width)) return;
      const left = Math.min(from.left, to.left);
      const top = Math.min(from.top, to.top);
      const span = {
        left,
        top,
        width: Math.max(from.left + from.width, to.left + to.width) - left,
        height: Math.max(from.top + from.height, to.top + to.height) - top,
      };
      running = el.animate(
        [{ ...px(from), easing: "cubic-bezier(0.5, 0, 0.6, 1)" }, { ...px(span), offset: 0.38, easing: settle }, px(to)],
        { duration: 560 },
      );
    };
    if ("ResizeObserver" in window) new ResizeObserver(() => container.dataset.selected && move(container.querySelector(container.dataset.selected))).observe(container);
    return { el, move };
  }
  // Items rise into place in turn, in the direction of travel (1 down the page, -1 up).
  const rise = (items, { dir = 1, delay = 0, step = 60, distance = 16, duration = 480 } = {}) =>
    on()
      ? [...items].map((item, i) =>
          item.animate([{ opacity: 0, transform: `translateY(${distance * dir}px)` }, { opacity: 1, transform: "none" }], {
            duration,
            delay: delay + i * step,
            easing: settle,
            fill: "both",
          }),
        )
      : [];
  // Items drift away before they are replaced.
  const drift = (items, { dir = 1, duration = 150, distance = 10 } = {}) =>
    on()
      ? [...items].map((item) =>
          item.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateY(${-distance * dir}px)` }], {
            duration,
            easing: leave,
            fill: "both",
          }),
        )
      : [];
  // A short confirmation pop for buttons and status text.
  const pop = (el) =>
    on() && el.animate([{ transform: "scale(0.92)", opacity: 0.6 }, { transform: "scale(1.04)", opacity: 1, offset: 0.6 }, { transform: "none" }], { duration: 360, easing: settle });
  const done = (animations) => Promise.allSettled(animations.map((animation) => animation.finished));
  return { on, settle, leave, rect, px, selection, rise, drift, pop, done };
})();
const FLIGHT_STATE = "The customer wants to change a booked flight. Fare rules are missing.";
const INVOICE_STATE = "Invoice 2026-0412\nDate: 3 October 2026\nTotal due: €1,240.50";

const examples = {
  choice: {
    question: "What should happen next?",
    state: FLIGHT_STATE,
    rows: [
      ["Ask for fare rules", 0.62],
      ["Quote a change fee", 0.21],
      ["Rebook the flight", 0.17],
    ],
  },
  noul: {
    question: "Are the fare rules available?",
    state: FLIGHT_STATE,
    rows: [
      ["True", 0.08],
      ["False", 0.92],
    ],
  },
  score: {
    question: "How complete is the information for rebooking?",
    state: FLIGHT_STATE,
    rows: [
      ["0 · Incomplete", 0.7],
      ["1 · Partially complete", 0.25],
      ["2 · Complete", 0.05],
    ],
    showExpectation: true,
  },
  extraction: {
    question: "Extract fields from this document.",
    state: INVOICE_STATE,
    fields: [
      { name: "invoice_number", type: "text", value: '"2026-0412"', span: "span [8, 17)" },
      { name: "invoice_date", type: "date", value: '"2026-10-03"', span: "span [24, 38)" },
      { name: "total", type: "number", value: "1240.5", span: "span [51, 59)" },
      { name: "po_number", type: "text · missing", value: "null", isNull: true, span: "missing" },
    ],
  },
};
const tabs = [...document.querySelectorAll('[role="tab"]')].filter((tab) => !tab.closest("[data-tour]"));
const tabSelection = tabs.length ? motion.selection(tabs[0].parentElement, "tabs-selection") : null;
let shownPanel = null;
// Bars grow from zero and their values count up, so each example reads as a fresh answer.
function playResults(panel, delay = 0) {
  if (!motion.on()) return;
  panel.querySelectorAll(".track span").forEach((bar, i) =>
    bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 700, delay: delay + 120 + i * 90, easing: motion.settle, fill: "backwards" }),
  );
  panel.querySelectorAll(".result .value").forEach((value, i) => {
    const target = Number(value.textContent);
    if (!Number.isFinite(target)) return;
    const start = performance.now() + delay + 120 + i * 90;
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / 700));
      value.textContent = (target * (1 - (1 - t) ** 3)).toFixed(2);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
function handOver(from, to, dir) {
  if (!motion.on() || !from || from === to) return;
  from.classList.add("is-leaving");
  // Only what changes moves: a state shared by both examples stays still.
  const sameState = from.querySelector(".state-text")?.textContent === to.querySelector(".state-text")?.textContent;
  const parts = (panel) =>
    panel.querySelectorAll(`${sameState ? "" : ".state, "}.question, .example-results > *, .expectation:not([hidden])`);
  motion.done(motion.drift(parts(from), { dir })).then(() => from.classList.remove("is-leaving"));
  motion.rise(parts(to), { dir, delay: 120, step: 55 });
  playResults(to, 160);
}
function selectTab(tab) {
  const before = shownPanel;
  const dir = before ? Math.sign(tabs.indexOf(tab) - tabs.findIndex((item) => item.getAttribute("aria-controls") === before.id)) || 1 : 1;
  tabSelection?.move(tab);
  tab.parentElement.dataset.selected = `#${tab.id}`;
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(item.getAttribute("aria-controls"));
    panel.setAttribute("aria-hidden", String(!selected));
    panel.inert = !selected;
    panel.tabIndex = selected ? 0 : -1;
    if (selected) shownPanel = panel;
  });
  handOver(before, shownPanel, dir);
}

function renderExample(example, panel) {
  panel.querySelector(".state-text").textContent = example.state;
  panel.querySelector(".question").textContent = example.question;
  const results = panel.querySelector(".example-results");
  results.replaceChildren();

  if (example.fields) {
    for (const field of example.fields) {
      const row = document.createElement("div");
      row.className = `field-item${field.isNull ? " field-missing" : ""}`;

      const head = document.createElement("div");
      head.className = "field-head";
      const key = document.createElement("span");
      key.className = "field-key";
      const name = document.createElement("span");
      name.className = "field-name";
      name.textContent = field.name;
      key.append(name);
      const type = document.createElement("span");
      type.className = "field-type micro";
      type.textContent = field.type;
      head.append(key, type);

      const body = document.createElement("div");
      body.className = "field-body";
      const val = document.createElement("span");
      val.className = `field-val${field.isNull ? " null" : ""}`;
      val.textContent = field.value;
      const span = document.createElement("span");
      span.className = "field-span micro";
      span.textContent = field.span;
      body.append(val, span);

      row.append(head, body);
      results.append(row);
    }
  } else if (example.rows) {
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
  }

  const expectation = panel.querySelector(".expectation");
  if (example.showExpectation && example.rows) {
    const expectedPosition = example.rows.reduce(
      (sum, row, index) => sum + index * row[1],
      0,
    );
    expectation.textContent = `Expected position: ${expectedPosition.toFixed(2)} on a 0–${example.rows.length - 1} scale. Computed in code.`;
    expectation.hidden = false;
  } else {
    expectation.textContent = "";
    expectation.hidden = true;
  }
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
if (tabs.length) {
  const initialPanel = document.getElementById("decision-panel");
  const template = initialPanel.cloneNode(true);
  tabs.forEach((tab, index) => {
    const panel = index === 0 ? initialPanel : template.cloneNode(true);
    if (index > 0) {
      panel.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    }
    panel.id = `decision-panel-${tab.dataset.kind}`;
    panel.setAttribute("aria-labelledby", tab.id);
    tab.setAttribute("aria-controls", panel.id);
    renderExample(examples[tab.dataset.kind], panel);
    initialPanel.parentElement.append(panel);
  });
  selectTab(tabs[0]);
  tabs[0].parentElement.classList.add("tabs-ready");
  // The first example plays its answer once it comes into view.
  if ("IntersectionObserver" in window) {
    const seen = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      seen.disconnect();
      playResults(shownPanel);
    }, { threshold: 0.4 });
    seen.observe(initialPanel.parentElement);
  }
}
document.querySelectorAll("[data-copy]").forEach((button) => {
  button.hidden = false;
  button.addEventListener("click", async () => {
    const text = document.getElementById(button.dataset.copy).textContent;
    try {
      await navigator.clipboard.writeText(text);
      document.getElementById("copy-status").textContent = "Checksum copied.";
      button.textContent = "Copied";
      motion.pop(button);
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
    if (feedback && "MutationObserver" in window)
      new MutationObserver(() => feedback.textContent.trim() && motion.rise([feedback], { distance: 8, duration: 360 })).observe(feedback, { childList: true, characterData: true, subtree: true });
    const container = form.querySelector("[data-turnstile]");
    const label = button.textContent;
    let token = "";
    let widget;
    let submitting = false;
    function showChallenge() { container.classList.add("is-interactive"); }
    function hideChallenge() { container.classList.remove("is-interactive"); }
    function checkFailed(message) {
      token = "";
      button.disabled = true;
      retry.hidden = false;
      showChallenge();
      if (!submitting && form.dataset.state !== "success") { feedback.textContent = message; form.dataset.state = "error"; }
    }
    async function prepare() {
      retry.hidden = true;
      hideChallenge();
      if (!submitting && form.dataset.state !== "success") { feedback.textContent = ""; form.dataset.state = "checking"; }
      try {
        const challenge = await loadChallenge();
        if (widget !== undefined) { challenge.reset(widget); return; }
        widget = challenge.render(container, {
          sitekey: SITE_KEY, action: form.dataset.kind,
          // Managed widget: no box unless Cloudflare requires a click. Size applies only then.
          size: form.clientWidth >= 300 ? "flexible" : "compact", appearance: "interaction-only",
          "before-interactive-callback": showChallenge,
          callback: (value) => {
            token = value;
            button.disabled = submitting;
            retry.hidden = true;
            hideChallenge();
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
      // Only the contact form has a message. Other forms must not send one.
      const message = fields.get("message");
      if (typeof message === "string") data.message = message;
      const controls = [...form.querySelectorAll("input, textarea, button")];
      submitting = true;
      controls.forEach(control => { control.disabled = true; });
      form.setAttribute("aria-busy", "true");
      form.dataset.state = "submitting";
      button.textContent = "Sending…";
      feedback.textContent = form.dataset.kind === "contact" ? "Saving your message." : "Saving your request.";
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
          contact: "Your message is saved. We will reply by email.",
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
        hideChallenge();
        if (widget !== undefined) window.turnstile.reset(widget);
      }
    });
    // Cancel native submission before the browser check can enable this button.
    prepare();
  });
})();

// Disclosures: every <details> opens and closes with motion. Inline content grows in height and fades up; a dropdown
// menu (positioned content) drops down from its trigger. Escape and outside clicks still close at once.
document.querySelectorAll("details").forEach((details) => {
  const summary = details.querySelector(":scope > summary");
  if (!summary) return;
  const content = () => [...details.children].filter((child) => child !== summary);
  const isMenu = () => content().some((child) => getComputedStyle(child).position === "absolute");
  let running = [];
  const stop = () => {
    running.forEach((animation) => animation.cancel());
    running = [];
    details.style.removeProperty("height");
    details.style.removeProperty("overflow");
  };
  summary.addEventListener("click", (event) => {
    if (!motion.on()) return;
    event.preventDefault();
    const opening = !details.open || details.dataset.closing === "true";
    stop();
    delete details.dataset.closing;
    if (isMenu()) {
      const menu = content();
      if (opening) {
        details.open = true;
        running = menu.map((el) => el.animate([{ opacity: 0, transform: "translateY(-8px) scale(0.98)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: motion.settle }));
      } else {
        details.dataset.closing = "true";
        running = menu.map((el) => el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-6px) scale(0.98)" }], { duration: 140, easing: motion.leave, fill: "forwards" }));
        motion.done(running).then(() => {
          if (details.dataset.closing !== "true") return;
          delete details.dataset.closing;
          details.open = false;
          stop();
        });
      }
      return;
    }
    const start = details.offsetHeight;
    const cs = getComputedStyle(details);
    const closed = summary.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    details.style.overflow = "hidden";
    if (opening) {
      details.open = true;
      const end = details.offsetHeight;
      running = [details.animate([{ height: `${start}px` }, { height: `${end}px` }], { duration: 420, easing: motion.settle }), ...motion.rise(content(), { delay: 60, distance: 10, duration: 420 })];
      motion.done(running.slice(0, 1)).then(() => details.style.removeProperty("overflow"));
    } else {
      details.dataset.closing = "true";
      running = [details.animate([{ height: `${start}px` }, { height: `${closed}px` }], { duration: 300, easing: motion.leave, fill: "forwards" }), ...motion.drift(content(), { duration: 160, distance: 6 })];
      motion.done(running).then(() => {
        if (details.dataset.closing !== "true") return;
        delete details.dataset.closing;
        details.open = false;
        stop();
      });
    }
  });
});

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

// Use cases: switch between the step-by-step view and the code, and reveal example steps.
(() => {
  const main = document.querySelector("main");
  const bar = document.querySelector(".view-bar");
  if (!bar) return;
  const buttons = bar.querySelectorAll("button[data-view]");
  const toggle = bar.querySelector(".view-toggle");
  const pill = toggle ? motion.selection(toggle, "view-selection") : null;
  function setView(view) {
    if (view === "code") main.dataset.view = "code";
    else delete main.dataset.view;
    buttons.forEach((button) => {
      const pressed = button.dataset.view === (view || "story");
      button.setAttribute("aria-pressed", String(pressed));
      if (pressed && toggle) {
        toggle.dataset.selected = `button[data-view="${button.dataset.view}"]`;
        pill?.move(button);
      }
    });
  }
  buttons.forEach((button) => button.addEventListener("click", () => {
    // Keep the section that the reader is in at the same screen position.
    const anchor = [...document.querySelectorAll(".api")].find((api) => api.getBoundingClientRect().bottom > window.innerHeight / 2);
    const before = anchor?.getBoundingClientRect().top;
    setView(button.dataset.view);
    if (anchor) window.scrollBy({ top: anchor.getBoundingClientRect().top - before, behavior: "instant" });
    // The view that just appeared rises in where the reader is looking.
    const shown = [...document.querySelectorAll(button.dataset.view === "code" ? ".code-view" : ".story-view")].filter((view) => {
      const r = view.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    });
    motion.rise(shown, { distance: 12, duration: 420 });
    const url = new URL(location.href);
    if (button.dataset.view === "code") url.searchParams.set("view", "code");
    else url.searchParams.delete("view");
    history.replaceState(history.state, "", url);
  }));
  bar.hidden = false;
  setView(new URLSearchParams(location.search).get("view"));
  toggle?.classList.add("view-toggle-ready");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!("IntersectionObserver" in window) || reducedMotion.matches) return;
  const observer = new IntersectionObserver((entries) => {
    let order = 0;
    entries.forEach((entry) => {
      // Hide a step only after the observer reports it, so steps never stay hidden.
      if (!entry.isIntersecting) return entry.target.classList.add("armed");
      observer.unobserve(entry.target);
      entry.target.style.setProperty("--order", order++);
      entry.target.classList.add("shown");
    });
  }, { threshold: 0.1 });
  const steps = document.querySelectorAll(".story li");
  steps.forEach((step) => observer.observe(step));
  document.querySelectorAll(".story-replay").forEach((replay) => {
    replay.hidden = false;
    replay.addEventListener("click", () => replay.parentElement.querySelectorAll(".story li").forEach((step, index) => {
      step.classList.remove("shown");
      step.classList.add("armed");
      void step.offsetWidth; // Restart the transition.
      step.style.setProperty("--order", index);
      step.classList.add("shown");
    }));
  });
  reducedMotion.addEventListener("change", () => {
    observer.disconnect();
    steps.forEach((step) => step.classList.remove("armed"));
  });
})();

// Sprouts: the garden routines and the cast's colours, ported from ItsVej/Sprouts
// (apps/web/src/garden-routine.ts, garden-gait.ts and packages/ui/src/avatars/tint.ts).
(() => {
  if (typeof document.querySelector !== "function") return;
  const garden = document.querySelector("[data-garden]");
  const cast = document.querySelector("[data-cast]");
  if (!garden && !cast) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // [own colour name, body anchor, body hues, colours to keep, five more tints as [name, h, s, l]]
  const TINTS = {
    carrot: ["Orange", "#d9772b", [27], [], [["Red", 358, 0.8, 0.48], ["Pink", 335, 0.7, 0.68], ["Lemon", 52, 0.95, 0.56], ["Blue", 212, 0.85, 0.55], ["Purple", 278, 0.55, 0.42]]],
    tomato: ["Red", "#d4472f", [8], [], [["Yellow", 48, 0.92, 0.55], ["Orange", 27, 0.92, 0.55], ["Lime", 95, 0.55, 0.48], ["Pink", 335, 0.7, 0.68], ["Purple", 280, 0.5, 0.4]]],
    potato: ["Brown", "#b99465", [33], [], [["Red", 350, 0.62, 0.46], ["Purple", 275, 0.45, 0.38], ["Gold", 46, 0.8, 0.58], ["Pale", 48, 0.35, 0.78], ["Blue", 215, 0.5, 0.5]]],
    corn: ["Yellow", "#e4b64a", [43], [], [["Pink", 335, 0.65, 0.72], ["Purple", 275, 0.45, 0.36], ["Blue", 212, 0.6, 0.5], ["Red", 355, 0.7, 0.45], ["Orange", 24, 0.85, 0.52]]],
    eggplant: ["Purple", "#5b3a6e", [280], [], [["Red", 355, 0.7, 0.42], ["Green", 135, 0.42, 0.36], ["Blue", 222, 0.6, 0.42], ["Pink", 325, 0.6, 0.64], ["Orange", 28, 0.85, 0.52]]],
    cucumber: ["Green", "#3f7a4a", [133], [], [["Lemon", 52, 0.85, 0.56], ["Pink", 335, 0.55, 0.7], ["Blue", 210, 0.7, 0.5], ["Purple", 280, 0.5, 0.42], ["Orange", 27, 0.85, 0.52]]],
    "bell-pepper": ["Red", "#b5332b", [3], [], [["Yellow", 50, 0.95, 0.55], ["Orange", 28, 0.95, 0.52], ["Green", 110, 0.55, 0.38], ["Purple", 282, 0.5, 0.4], ["Pink", 335, 0.7, 0.7]]],
    onion: ["Brown", "#c9a46a", [37], [], [["Red", 342, 0.55, 0.42], ["Green", 110, 0.45, 0.5], ["Purple", 275, 0.45, 0.45], ["Gold", 46, 0.9, 0.56], ["Pink", 332, 0.6, 0.72]]],
    garlic: ["Cream", "#e9e0cf", [40, 275], [], [["Purple", 280, 0.4, 0.55], ["Pink", 340, 0.6, 0.75], ["Black", 30, 0.12, 0.24], ["Gold", 46, 0.85, 0.62], ["Blue", 210, 0.5, 0.65]]],
    "leafy-green": ["Green", "#3e7d52", [140, 105], [], [["Red", 352, 0.55, 0.42], ["Lime", 78, 0.65, 0.5], ["Teal", 190, 0.5, 0.4], ["Purple", 280, 0.45, 0.42], ["Yellow", 50, 0.85, 0.52]]],
    broccoli: ["Green", "#3e7d52", [118, 140], [], [["Purple", 280, 0.45, 0.42], ["Yellow", 52, 0.75, 0.52], ["Orange", 27, 0.85, 0.52], ["Pink", 335, 0.55, 0.68], ["Blue", 210, 0.55, 0.45]]],
    "sweet-potato": ["Rust", "#9e4f3f", [8], [], [["Purple", 278, 0.45, 0.4], ["Orange", 27, 0.9, 0.5], ["Blue", 210, 0.55, 0.5], ["Yellow", 46, 0.85, 0.55], ["Pink", 335, 0.55, 0.6]]],
    ginger: ["Tan", "#d2b08a", [32, 45], [], [["Yellow", 48, 0.95, 0.55], ["Pink", 350, 0.6, 0.65], ["Blue", 210, 0.45, 0.6], ["Green", 110, 0.45, 0.55], ["Purple", 275, 0.35, 0.58]]],
    mushroom: ["Brown", "#b88e6c", [28], ["#d9cdb5", "#d6c9af", "#b5a68a"], [["Red", 355, 0.75, 0.5], ["Blue", 210, 0.7, 0.55], ["Purple", 275, 0.5, 0.5], ["Pink", 335, 0.6, 0.7], ["Yellow", 50, 0.9, 0.58]]],
    radish: ["Pink", "#c83b6c", [340], [], [["Orange", 27, 0.9, 0.55], ["Purple", 275, 0.5, 0.45], ["Yellow", 50, 0.9, 0.58], ["Blue", 215, 0.65, 0.5], ["Red", 2, 0.8, 0.5]]],
  };
  const INK = "#2b2a22";
  const CREAM = "#f3ecdc";
  const FIXED = new Set([CREAM, INK, "#ffffff"]);
  const HEX = /^#[0-9a-f]{6}$/i;
  function toHsl(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  function hsl(h, s, l) {
    const hue = ((h % 360) + 360) % 360;
    const sat = Math.min(1, Math.max(0, s));
    const light = Math.min(0.97, Math.max(0.07, l));
    const a = sat * Math.min(light, 1 - light);
    const channel = (n) => {
      const k = (n + hue / 30) % 12;
      const v = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(v * 255).toString(16).padStart(2, "0");
    };
    return `#${channel(0)}${channel(8)}${channel(4)}`;
  }
  const wrap = (degrees) => ((degrees + 540) % 360) - 180;
  function tintColour(icon, tint, colour) {
    const [, anchor, family, keep, tints] = TINTS[icon];
    const target = tint > 0 ? tints[tint - 1] : undefined;
    const hex = colour.toLowerCase();
    if (!target || FIXED.has(hex) || keep.includes(hex)) return colour;
    const [h, s, l] = toHsl(hex);
    if (s < 0.08 || !family.some((f) => Math.abs(wrap(h - f)) <= 30)) return colour;
    const [hf, sf, lf] = toHsl(anchor);
    const ratio = Math.min(1.5, Math.max(0.5, s / Math.max(sf, 0.05)));
    return hsl(target[1] + wrap(h - hf) * 0.25, target[2] * ratio, target[3] + (l - lf) * 0.9);
  }
  const swatch = (icon, tint) => {
    const [, anchor, , , tints] = TINTS[icon];
    const t = tint > 0 ? tints[tint - 1] : undefined;
    return t ? hsl(t[1], t[2], t[3]) : anchor;
  };
  const colourName = (icon, tint) => (tint > 0 ? TINTS[icon][4][tint - 1][0] : TINTS[icon][0]);

  function wear(svg, icon, tint) {
    svg.querySelectorAll("[fill], [stroke]").forEach((element) => {
      for (const name of ["fill", "stroke"]) {
        const key = `own${name}`;
        if (element.dataset[key] === undefined) element.dataset[key] = element.getAttribute(name) || "";
        const own = element.dataset[key];
        if (HEX.test(own)) element.setAttribute(name, tintColour(icon, tint, own));
      }
    });
    // Faces on a dark skin need cream eye whites and cream lines; light skins use ink.
    const whites = svg.querySelectorAll(".rig-white");
    const ownDark = whites[0]?.dataset.ownfill === CREAM;
    const t = tint > 0 ? TINTS[icon][4][tint - 1] : undefined;
    const dark = t ? t[3] < 0.5 : ownDark;
    whites.forEach((white) => white.setAttribute("fill", dark ? CREAM : "none"));
    svg.querySelectorAll(".rig-shut, .rig-mouth").forEach((line) => line.setAttribute("stroke", dark ? CREAM : INK));
  }

  if (cast) {
    const status = document.querySelector("[data-cast-status]");
    document.querySelector(".cast-hint")?.removeAttribute("hidden");
    // The cast opens on one row; the rest are one tap away.
    const more = document.querySelector(".cast-more");
    if (more) {
      cast.classList.add("cast-collapsed");
      more.hidden = false;
      more.addEventListener("click", () => {
        const hidden = [...cast.children].filter((li) => li.offsetParent === null);
        const first = hidden[0];
        cast.classList.remove("cast-collapsed");
        motion.rise(hidden, { step: 45, distance: 18, duration: 520 });
        more.setAttribute("aria-expanded", "true");
        more.hidden = true;
        first?.querySelector(".cast-card")?.focus();
      });
    }
    cast.querySelectorAll(".cast-card").forEach((card) => {
      const icon = card.dataset.icon;
      if (!TINTS[icon]) return;
      const dots = card.querySelector(".cast-swatches");
      for (let tint = 0; tint < 6; tint++) {
        const dot = document.createElement("i");
        dot.style.setProperty("--swatch", swatch(icon, tint));
        if (tint === 0) dot.dataset.on = "";
        dots.append(dot);
      }
      card.addEventListener("click", () => {
        const tint = (Number(card.dataset.tint) + 1) % 6;
        const svg = card.querySelector(".garden-rig");
        card.dataset.tint = String(tint);
        wear(svg, icon, tint);
        card.querySelector(".cast-colour").textContent = colourName(icon, tint);
        [...dots.children].forEach((dot, i) => dot.toggleAttribute("data-on", i === tint));
        if (status) status.textContent = `${card.querySelector(".cast-name").textContent}, ${colourName(icon, tint).toLowerCase()}.`;
        if (!reducedMotion.matches && svg.animate) {
          svg.animate(
            [{ transform: "translateY(0)" }, { transform: "translateY(-9%) scale(1.04, 0.97)" }, { transform: "translateY(0)" }],
            { duration: 420, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
          );
        }
      });
    });
    // Cards below the fold rise in one after another; anything already on screen stays put.
    if ("IntersectionObserver" in window && !reducedMotion.matches) {
      const cards = [...cast.children];
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        cards.forEach((card, i) => card.animate?.(
          [{ opacity: 0, transform: "translateY(16px) scale(0.94)" }, { opacity: 1, transform: "none" }],
          { duration: 420, delay: i * 45, fill: "backwards", easing: "cubic-bezier(0.34, 1.4, 0.64, 1)" },
        ));
      }, { threshold: 0.08 });
      if (cast.getBoundingClientRect().top >= window.innerHeight) observer.observe(cast);
    }
  }

  if (!garden) return;
  // The walk cycle covers this many rig units (the 120-unit-wide character) per second without sliding.
  const GAIT_SPEED = (2 * 10) / (0.58 * 0.6);
  function beats(routine, index, first) {
    if (routine === "stand") return [{ motion: "idle", to: 0 }];
    if (routine === "work") {
      return [
        { motion: "tend", seconds: 5.5, to: 1 },
        { motion: "walk", to: -1 },
        { motion: "idle", seconds: 1.2, to: -1 },
        { motion: "walk", to: 1 },
      ];
    }
    const side = index % 2 ? -1 : 1;
    return [
      { motion: "nap", seconds: first ? 2.5 + index * 3 : 10, to: 0 },
      { motion: "walk", to: 0.9 * side },
      { motion: "idle", seconds: 1.8, to: 0.9 * side },
      { motion: "walk", to: -0.7 * side },
      { motion: "idle", seconds: 2.4, to: -0.7 * side },
      { motion: "walk", to: 0 },
    ];
  }
  function routineStep(routine, index, count) {
    const cycle = beats(routine, index, count === 0);
    const beat = (n) => cycle[((n % cycle.length) + cycle.length) % cycle.length];
    const current = beat(count);
    const to = current.to ?? 0;
    const from = current.motion === "walk" ? (beat(count - 1).to ?? 0) : to;
    // A pause keeps the direction of the walk that led to it; sitting and watering face the bench and plot.
    const heading = current.motion === "idle" ? beat(count - 1) : current;
    const headingFrom = heading === current ? from : (beat(count - 2).to ?? 0);
    const facing = heading.motion === "walk" && (heading.to ?? 0) < headingFrom ? "left" : "right";
    return { motion: current.motion, seconds: current.seconds, from, to, facing };
  }

  const pause = garden.querySelector(".garden-pause");
  const running = new Set();
  let started = false;
  let chosen = false;
  let offscreen = false;
  let away = false;
  const place = (to) => `translateX(${(to * 50).toFixed(2)}cqw)`;
  const still = () => chosen || offscreen || away || reducedMotion.matches;
  function play(walker, count) {
    const lane = walker.parentElement;
    const rig = walker.querySelector(".garden-rig");
    const step = routineStep(walker.dataset.routine, Number(walker.dataset.index), count);
    rig.dataset.motion = step.motion;
    walker.firstElementChild.dataset.facing = step.facing;
    walker.classList.remove("at-end");
    let duration = (step.seconds ?? 0) * 1000;
    if (step.motion === "walk") {
      const distance = (Math.abs(step.to - step.from) * lane.clientWidth) / 2;
      const speed = (GAIT_SPEED * walker.clientWidth) / 120;
      duration = speed > 0 ? (distance / speed) * 1000 : 0;
    }
    if (!duration) {
      walker.style.transform = place(step.to);
      return;
    }
    const animation = walker.animate([{ transform: place(step.from) }, { transform: place(step.to) }], { duration, fill: "forwards" });
    running.add(animation);
    if (still()) animation.pause();
    animation.onfinish = () => {
      running.delete(animation);
      play(walker, count + 1);
    };
  }
  function update() {
    if (!started && !reducedMotion.matches && walkerSupport()) {
      started = true;
      garden.querySelectorAll(".walker").forEach((walker) => play(walker, 0));
    }
    running.forEach((animation) => (still() ? animation.pause() : animation.play()));
    garden.classList.toggle("garden-paused", chosen);
    garden.classList.toggle("garden-resting", (offscreen || away) && !chosen);
  }
  const walkerSupport = () => typeof Element.prototype.animate === "function" && CSS.supports?.("container-type", "inline-size");
  if (pause && !reducedMotion.matches) {
    pause.hidden = false;
    pause.addEventListener("click", () => {
      chosen = !chosen;
      pause.setAttribute("aria-pressed", String(chosen));
      pause.querySelector("span").textContent = chosen ? "Play the garden" : "Pause the garden";
      update();
    });
  }
  reducedMotion.addEventListener("change", () => {
    if (pause) pause.hidden = reducedMotion.matches;
    update();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      offscreen = !entries[entries.length - 1].isIntersecting;
      update();
    }).observe(garden);
  }
  document.addEventListener("visibilitychange", () => {
    away = document.hidden;
    update();
  });
  update();
})();

// Sprouts films: loop only while on screen and the tab is visible; reduced motion keeps the poster and native controls.
(() => {
  const films = document.querySelectorAll("[data-film]");
  if (!films.length) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  films.forEach((film) => {
    const video = film.querySelector("video");
    const toggle = film.querySelector(".film-toggle");
    let chosen = false;
    let visible = false;
    const update = () => {
      const motion = !reducedMotion.matches;
      video.controls = !motion;
      if (toggle) toggle.hidden = !motion;
      film.classList.toggle("film-paused", chosen);
      if (!motion) return;
      if (!chosen && visible && !document.hidden) video.play().catch(() => {});
      else video.pause();
    };
    toggle?.addEventListener("click", () => {
      chosen = !chosen;
      toggle.setAttribute("aria-pressed", String(chosen));
      toggle.querySelector("span").textContent = chosen ? "Play the film" : "Pause the film";
      update();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        update();
      }, { threshold: 0.2 }).observe(film);
    } else {
      visible = true;
    }
    document.addEventListener("visibilitychange", update);
    reducedMotion.addEventListener("change", update);
    update();
  });
})();

// Sprouts feature tour: tabs over real app screens (arrow keys, Home and End). A selection card slides to the chosen
// tab and the panels hand over in a short staged motion; reduced motion swaps them at once. Without this script every
// panel shows, stacked.
(() => {
  const tour = document.querySelector("[data-tour]");
  if (!tour) return;
  const nav = tour.querySelector(".tour-nav");
  const tabs = [...tour.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
  if (!nav || !tabs.length || panels.some((panel) => !panel)) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const still = () => reducedMotion.matches || typeof Element.prototype.animate !== "function";
  const settleEase = "cubic-bezier(0.16, 1, 0.3, 1)";
  const selection = motion.selection(nav, "tour-indicator");
  const slide = (tab) => {
    nav.dataset.selected = `#${tab.id}`;
    selection.move(tab);
  };
  let current = -1;
  let running = [];
  const decoded = (img) =>
    !img || (img.complete && img.naturalWidth)
      ? Promise.resolve()
      : Promise.race([
          (img.loading = "eager", img.decode().catch(() => {})),
          new Promise((resolve) => setTimeout(resolve, 400)),
        ]);
  const base = (el) => {
    const filter = getComputedStyle(el).filter;
    return filter === "none" ? "" : `${filter} `;
  };
  function settle() {
    running.forEach((animation) => animation.cancel());
    running = [];
    panels.forEach((panel, i) => {
      panel.hidden = i !== current;
      panel.classList.remove("is-entering", "is-leaving");
    });
  }

  async function select(index, focus) {
    if (focus) {
      tabs[index].focus({ preventScroll: true });
      tabs[index].scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    if (index === current) return;
    const previous = current;
    current = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    slide(tabs[index]);
    settle();
    if (previous < 0 || still()) return;
    const incoming = panels[index];
    const outgoing = panels[previous];
    outgoing.hidden = false;
    const image = incoming.querySelector("img");
    await decoded(image);
    if (current !== index) return;
    const dir = index > previous ? 1 : -1;
    const run = (el, keyframes, options) => {
      if (!el) return;
      running.push(el.animate(keyframes, { fill: "both", ...options }));
    };
    outgoing.classList.add("is-leaving");
    incoming.hidden = false;
    incoming.classList.add("is-entering");
    // Out: the old words and screen drift away in the direction of travel.
    run(outgoing.querySelector(".tour-copy"), [
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: `translateY(${-10 * dir}px)` },
    ], { duration: 140, easing: "cubic-bezier(0.4, 0, 1, 1)" });
    const old = outgoing.querySelector(".tour-shot img");
    if (old) {
      const f = base(old);
      run(old, [
        { opacity: 1, transform: "none", filter: `${f}blur(0px)` },
        { opacity: 0, transform: `translateY(${-16 * dir}px) scale(0.985)`, filter: `${f}blur(4px)` },
      ], { duration: 260, easing: "cubic-bezier(0.4, 0, 1, 1)" });
    }
    // In, once the old words are gone: the heading, then the text, then the screen rises into place.
    [...incoming.querySelectorAll(".tour-copy > *")].forEach((el, i) =>
      run(el, [
        { opacity: 0, transform: `translateY(${16 * dir}px)` },
        { opacity: 1, transform: "none" },
      ], { duration: 480, delay: 170 + i * 60, easing: settleEase }),
    );
    if (image) {
      const f = base(image);
      run(image, [
        { opacity: 0, transform: `translateY(${26 * dir}px) scale(0.965)`, filter: `${f}blur(8px)` },
        { opacity: 1, transform: "none", filter: `${f}blur(0px)` },
      ], { duration: 640, delay: 150, easing: settleEase });
    }
    await Promise.allSettled(running.map((animation) => animation.finished));
    if (current === index) settle();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i, false));
    tab.addEventListener("keydown", (event) => {
      const last = tabs.length - 1;
      const next = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: last }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select((next + tabs.length) % tabs.length, true);
    });
  });
  // Load every screen once the tour is near, so switching never waits on the network.
  if ("IntersectionObserver" in window) {
    const near = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      panels.forEach((panel) => panel.querySelector("img")?.setAttribute("loading", "eager"));
      near.disconnect();
    }, { rootMargin: "800px 0px" });
    near.observe(tour);
  }
  tour.classList.add("tour-ready");
  select(0, false);
})();

// Contact: a visit from the Sprouts iPhone button starts the message for you.
(() => {
  if (location.hash !== "#sprouts-iphone") return;
  const message = document.getElementById("contact-message");
  if (message && !message.value) message.value = "I'd like access to the Sprouts iPhone app.";
})();

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

// Extraction showcase: link hover and keyboard focus between fields and evidence spans.
(() => {
  if (typeof document.querySelectorAll !== "function") return;
  document.querySelectorAll(".extraction-showcase").forEach((showcase) => {
    const fields = showcase.querySelectorAll ? showcase.querySelectorAll(".field-item[data-field]") : [];
    const marks = showcase.querySelectorAll ? showcase.querySelectorAll(".doc-text mark[data-field]") : [];
    function setActive(name) {
      fields.forEach((f) => f.classList && f.classList.toggle("is-active", Boolean(name && f.dataset?.field === name)));
      marks.forEach((m) => m.classList && m.classList.toggle("is-active", Boolean(name && m.dataset?.field === name)));
    }
    fields.forEach((field) => {
      field.addEventListener?.("mouseenter", () => setActive(field.dataset?.field));
      field.addEventListener?.("mouseleave", () => setActive(null));
      field.addEventListener?.("focus", () => setActive(field.dataset?.field));
      field.addEventListener?.("blur", () => setActive(null));
    });
    marks.forEach((mark) => {
      mark.addEventListener?.("mouseenter", () => setActive(mark.dataset?.field));
      mark.addEventListener?.("mouseleave", () => setActive(null));
    });
  });
})();
