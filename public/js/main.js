"use strict";

(() => {
const menuButton = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");

const translate = typeof i18n !== "undefined" ? i18n.t : () => undefined;

function updateMenuLabel() {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  const key = isOpen ? "nav.menuClose" : "nav.menuOpen";
  menuButton.setAttribute("data-i18n-aria-label", key);
  menuButton.setAttribute("aria-label", translate(key) ?? (isOpen ? "Cerrar menú" : "Abrir menú"));
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
    const target = link.hash ? document.querySelector(link.hash) : null;
    if (target && target.getBoundingClientRect().top <= window.innerHeight * .3) active = link;
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

function extractYouTubeId(rawSrc) {
  if (!rawSrc) return "";
  try {
    const url = new URL(rawSrc);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0];
    if (url.pathname.includes("/embed/")) return url.pathname.split("/embed/")[1].split("/")[0];
    return url.searchParams.get("v") || "";
  } catch {
    return /^[\w-]{11}$/.test(rawSrc.trim()) ? rawSrc.trim() : "";
  }
}

document.querySelectorAll("[data-video-facade]").forEach(facade => {
  const trigger = facade.querySelector(".video-trigger");
  const videoId = extractYouTubeId(facade.dataset.videoSrc);
  const externalLink = facade.closest(".product")?.querySelector("[data-video-external]");
  if (!trigger || !videoId) return;
  const encodedId = encodeURIComponent(videoId);
  if (externalLink) externalLink.href = `https://www.youtube.com/watch?v=${encodedId}`;
  trigger.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${encodedId}?autoplay=1&rel=0`;
    iframe.title = trigger.getAttribute("aria-label") || "Video de presentación de TerraTech";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    facade.replaceChildren(iframe);
  });
});

document.querySelectorAll("[data-screen-tabs]").forEach(tablist => {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute("aria-controls")));
  if (!tabs.length || tabs.some((_, index) => !panels[index])) return;

  let activeIndex = Math.max(0, tabs.findIndex(tab => tab.getAttribute("aria-selected") === "true"));

  function warmPanel(index) {
    const img = panels[index]?.querySelector("img");
    if (img && img.loading === "lazy") img.loading = "eager";
  }

  function activateTab(nextIndex, shouldFocus = false) {
    if (nextIndex === activeIndex) {
      if (shouldFocus) tabs[nextIndex].focus();
      return;
    }
    const direction = nextIndex > activeIndex ? "next" : "prev";
    activeIndex = nextIndex;
    warmPanel(nextIndex);
    tabs.forEach((tab, index) => {
      const selected = index === nextIndex;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[index].removeAttribute("data-slide");
      panels[index].hidden = !selected;
    });
    panels[nextIndex].dataset.slide = direction;
    if (shouldFocus) tabs[nextIndex].focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("pointerenter", () => warmPanel(index), { once: true });
    tab.addEventListener("focus", () => warmPanel(index), { once: true });
    tab.addEventListener("click", () => activateTab(index));
    tab.addEventListener("keydown", event => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        activateTab((index + 1) % tabs.length, true);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        activateTab((index - 1 + tabs.length) % tabs.length, true);
      } else if (event.key === "Home") {
        event.preventDefault();
        activateTab(0, true);
      } else if (event.key === "End") {
        event.preventDefault();
        activateTab(tabs.length - 1, true);
      }
    });
  });
});

const stepsList = document.querySelector(".steps");
if (stepsList) {
  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      stepsList.getBoundingClientRect().top <= window.innerHeight * .88) {
    stepsList.classList.add("is-visible");
  } else {
    const stepsObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        stepsList.classList.add("is-visible");
        stepsObserver.disconnect();
      }
    }, { threshold: .2 });
    stepsObserver.observe(stepsList);
  }
}
})();
