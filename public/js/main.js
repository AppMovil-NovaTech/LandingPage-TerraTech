"use strict";

(async () => {
if (!await i18n.ready) return;

const menuButton = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");

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
      const target = link.hash ? document.querySelector(link.hash) : null;
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

document.addEventListener("terratech:languagechange", updateMenuLabel);
updateMenuLabel();
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
