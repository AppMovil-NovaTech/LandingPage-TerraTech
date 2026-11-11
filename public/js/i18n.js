"use strict";

// Dictionaries are loaded once; visitor-facing copy lives only in public/i18n/.
const i18n = (() => {
  let language = "es";
  let dictionaries = null;
  const controls = [...document.querySelectorAll("[data-lang], .menu-toggle, [data-open-terms]")];
  controls.forEach(button => { button.disabled = true; });

  function t(key) { return dictionaries?.[language]?.[key]; }

  function setLanguage(nextLanguage, persist = false) {
    if (!dictionaries || !Object.hasOwn(dictionaries, nextLanguage)) return;
    language = nextLanguage;
  document.documentElement.lang = language;
  document.title = t("meta.title");
  document.querySelector('meta[name="description"]').content = t("meta.description");
  document.querySelector('meta[property="og:title"]').content = t("meta.title");
  document.querySelector('meta[property="og:description"]').content = t("meta.description");
  document.querySelector('meta[property="og:locale"]').content = language === "es" ? "es_PE" : "en_US";

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const value = t(element.dataset.i18n);
    if (value !== undefined) element.textContent = value;
  });
  for (const attribute of ["aria-label", "alt"]) {
    document.querySelectorAll("[data-i18n-" + attribute + "]").forEach(element => {
      const key = element.getAttribute("data-i18n-" + attribute);
      element.setAttribute(attribute, t(key));
    });
  }
  document.querySelectorAll("[data-lang]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === language));
  });

    if (persist) {
      try { localStorage.setItem("terratech-language", language); } catch { /* Storage is optional. */ }
    }
    document.dispatchEvent(new Event("terratech:languagechange"));
  }

  const ready = (async () => {
    try {
      const entries = await Promise.all(["es", "en"].map(async lang => {
        const response = await fetch("public/i18n/" + lang + ".json");
        if (!response.ok) throw new Error("Unable to load " + lang + " translations");
        const data = await response.json();
        if (!data || typeof data !== "object" || Array.isArray(data) ||
            Object.values(data).some(value => typeof value !== "string")) {
          throw new Error("Invalid " + lang + " translations");
        }
        return [lang, data];
      }));
      const loaded = Object.fromEntries(entries);
      if (Object.keys(loaded.es).length !== Object.keys(loaded.en).length ||
          Object.keys(loaded.es).some(key => !Object.hasOwn(loaded.en, key))) {
        throw new Error("Translation keys do not match");
      }
      dictionaries = loaded;
      let initialLanguage = "es";
      try {
        const stored = localStorage.getItem("terratech-language");
        if (stored === "es" || stored === "en") initialLanguage = stored;
      } catch { /* Use Spanish when storage is unavailable. */ }
      setLanguage(initialLanguage);
      document.querySelectorAll("[data-lang]").forEach(button => {
        button.addEventListener("click", () => setLanguage(button.dataset.lang, true));
      });
      controls.forEach(button => { button.disabled = false; });
      return true;
    } catch (error) {
      console.warn("[i18n] Translations unavailable. Keeping the original Spanish page.", error);
      return false;
    }
  })();

  return { t, ready };
})();
