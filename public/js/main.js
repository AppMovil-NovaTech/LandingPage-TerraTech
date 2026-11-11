"use strict";

// Prevent native submission during loading and after a translation load failure.
document.querySelector("#demo-form").addEventListener("submit", event => event.preventDefault());

(async () => {
if (!await i18n.ready) return;

const state = { screen: "dashboard", loading: false, status: null, errors: new Map() };
const form = document.querySelector("#demo-form");
const submitButton = form.querySelector('[type="submit"]');
const submitLabel = document.querySelector("#submit-label");
const formStatus = document.querySelector("#form-status");
const menuButton = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");
const screenImage = document.querySelector("#gallery-screen");
const screenDescription = document.querySelector("#gallery-description");
const screenButtons = [...document.querySelectorAll("[data-screen]")];
const fields = {
  name: { input: document.querySelector("#full-name"), error: document.querySelector("#name-error") },
  email: { input: document.querySelector("#email"), error: document.querySelector("#email-error") },
  area: { input: document.querySelector("#land-area"), error: document.querySelector("#area-error") }
};

const translate = i18n.t;

function updateMenuLabel() {
  const key = menuButton.getAttribute("aria-expanded") === "true" ? "nav.menuClose" : "nav.menuOpen";
  menuButton.setAttribute("data-i18n-aria-label", key);
  menuButton.setAttribute("aria-label", translate(key));
}

function setMenu(open, returnFocus = false) {
  mainNav.classList.toggle("is-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  updateMenuLabel();
  if (returnFocus) menuButton.focus();
}

menuButton.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});
mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    const wasOpen = menuButton.getAttribute("aria-expanded") === "true";
    setMenu(false);
    if (wasOpen) {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    }
  });
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") setMenu(false, true);
});
document.addEventListener("click", event => {
  if (!event.target.closest(".site-header")) setMenu(false);
});
window.matchMedia("(min-width: 1080px)").addEventListener("change", event => {
  if (event.matches) setMenu(false);
});
function selectScreen(name, moveFocus = false) {
  if (!["dashboard", "history", "offline"].includes(name)) return;
  state.screen = name;
  screenImage.src = "public/images/screens/" + name + ".png";
  screenImage.dataset.i18nAlt = "screen." + name + "Alt";
  screenImage.alt = translate(screenImage.dataset.i18nAlt);
  screenDescription.dataset.i18n = "gallery." + name + "Text";
  screenDescription.textContent = translate(screenDescription.dataset.i18n);
  document.querySelector("#product-panel").setAttribute("aria-labelledby", "tab-" + name);
  screenButtons.forEach(button => {
    const selected = button.dataset.screen === name;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && moveFocus) button.focus();
  });
}
screenButtons.forEach((button, index) => {
  button.addEventListener("click", () => selectScreen(button.dataset.screen));
  button.addEventListener("keydown", event => {
    let targetIndex;
    if (event.key === "ArrowRight") targetIndex = (index + 1) % screenButtons.length;
    else if (event.key === "ArrowLeft") targetIndex = (index - 1 + screenButtons.length) % screenButtons.length;
    else if (event.key === "Home") targetIndex = 0;
    else if (event.key === "End") targetIndex = screenButtons.length - 1;
    else return;
    event.preventDefault();
    selectScreen(screenButtons[targetIndex].dataset.screen, true);
  });
});

function validateField(field) {
  const input = fields[field].input;
  if (field === "name" && !input.value.trim()) return "form.nameError";
  if (field === "email") {
    if (!input.value.trim()) return "form.emailRequired";
    if (input.validity.typeMismatch) return "form.emailInvalid";
  }
  if (field === "area" && (input.validity.badInput ||
      (input.value !== "" && (!Number.isFinite(Number(input.value)) || Number(input.value) <= 0)))) {
    return "form.areaError";
  }
  return null;
}

function setFieldError(field, key) {
  const { input, error } = fields[field];
  if (key) {
    state.errors.set(field, key);
    input.setAttribute("aria-invalid", "true");
    error.textContent = translate(key);
    error.hidden = false;
  } else {
    state.errors.delete(field);
    input.removeAttribute("aria-invalid");
    error.textContent = "";
    error.hidden = true;
  }
}

function renderFormStatus() {
  submitLabel.dataset.i18n = state.loading ? "form.loading" : "cta.demo";
  submitLabel.textContent = translate(submitLabel.dataset.i18n);
  submitButton.disabled = state.loading;
  form.setAttribute("aria-busy", String(state.loading));
  form.querySelector(".spinner").hidden = !state.loading;
  formStatus.hidden = !state.status;
  formStatus.classList.toggle("is-error", state.status === "form.errorSummary");
  formStatus.textContent = state.status ? translate(state.status) : "";
}

form.addEventListener("submit", event => {
  event.preventDefault();
  if (state.loading) return;
  Object.keys(fields).forEach(field => setFieldError(field, validateField(field)));
  if (state.errors.size) {
    state.status = "form.errorSummary";
    renderFormStatus();
    fields[state.errors.keys().next().value].input.focus();
    return;
  }
  state.status = null;
  state.loading = true;
  renderFormStatus();
  // Intentional local simulation. No request, mailto, analytics or personal-data storage.
  window.setTimeout(() => {
    state.loading = false;
    state.status = "form.success";
    renderFormStatus();
  }, 2000);
});

Object.entries(fields).forEach(([field, { input }]) => {
  input.addEventListener("input", () => {
    if (state.errors.has(field)) setFieldError(field, validateField(field));
    if (!state.loading && (state.status === "form.success" || !state.errors.size)) {
      state.status = null;
      renderFormStatus();
    }
  });
});

const navLinks = [...mainNav.querySelectorAll("[data-nav-link]")];
let scrollScheduled = false;
function updateActiveLink() {
  let active = null;
  for (const link of navLinks) {
    if (document.querySelector(link.hash).getBoundingClientRect().top <= window.innerHeight * .3) active = link;
  }
  navLinks.forEach(link => {
    if (link === active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  scrollScheduled = false;
}
window.addEventListener("scroll", () => {
  if (!scrollScheduled) { scrollScheduled = true; window.requestAnimationFrame(updateActiveLink); }
}, { passive: true });
window.addEventListener("resize", updateActiveLink);

document.addEventListener("terratech:languagechange", () => {
  state.errors.forEach((key, field) => { fields[field].error.textContent = translate(key); });
  updateMenuLabel();
  renderFormStatus();
});
updateMenuLabel();
renderFormStatus();
updateActiveLink();

const termsDialog = document.querySelector("#terms-modal");
const termsTrigger = document.querySelector("[data-open-terms]");
let termsOpener = null;
termsTrigger.addEventListener("click", () => {
  termsOpener = document.activeElement;
  termsDialog.showModal();
  document.body.classList.add("terms-open");
  termsDialog.scrollTop = 0;
  termsDialog.focus();
});
function closeTerms() { termsDialog.close(); }
termsDialog.querySelector("[data-close-terms]").addEventListener("click", closeTerms);
termsDialog.addEventListener("click", event => {
  const bounds = termsDialog.getBoundingClientRect();
  if (event.target === termsDialog && (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom)) closeTerms();
});
termsDialog.addEventListener("cancel", event => {
  event.preventDefault();
  closeTerms();
});
termsDialog.addEventListener("close", () => {
  document.body.classList.remove("terms-open");
  termsOpener?.focus({ preventScroll: true });
});
termsDialog.addEventListener("keydown", event => {
  if (event.key !== "Tab") return;
  const controls = [...termsDialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')]
    .filter(element => !element.disabled && element.getClientRects().length);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (!first) { event.preventDefault(); termsDialog.focus(); return; }
  if (event.shiftKey && (document.activeElement === first || document.activeElement === termsDialog)) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === termsDialog)) {
    event.preventDefault(); first.focus();
  }
});
})();
