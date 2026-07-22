(() => {
  "use strict";

  async function readText(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to load ${url} (${response.status})`);
    return response.text();
  }

  function appendMarkup(markup, target = document.body) {
    const template = document.createElement("template");
    template.innerHTML = markup;
    target.append(template.content);
  }

  function runScript(sourceScript) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      Array.from(sourceScript.attributes).forEach((attribute) => script.setAttribute(attribute.name, attribute.value));
      if (!sourceScript.src) {
        script.textContent = sourceScript.textContent;
        document.body.append(script);
        resolve();
        return;
      }
      script.async = false;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", () => {
        if (sourceScript.src.includes("@supabase/supabase-js")) {
          resolve();
        } else {
          reject(new Error(`Unable to load ${sourceScript.getAttribute("src")}`));
        }
      }, { once: true });
      document.body.append(script);
    });
  }

  async function boot() {
    const status = document.getElementById("shellLoaderStatus");
    try {
      const [appMarkup, scriptsMarkup, progressMarkup] = await Promise.all([
        readText("/shell/app-markup.html?v=20260722-3"),
        readText("/shell/scripts.html?v=20260722-3"),
        readText("/shell/mobile-progress.html?v=20260721-1")
      ]);
      appendMarkup(appMarkup);

      const scriptsTemplate = document.createElement("template");
      scriptsTemplate.innerHTML = scriptsMarkup;
      await Promise.all(Array.from(scriptsTemplate.content.querySelectorAll("script"), runScript));
      appendMarkup(progressMarkup);
      status?.remove();
    } catch (error) {
      if (status) {
        status.textContent = "The page shell did not load. Refresh the page or try again.";
        status.classList.add("is-error");
      }
      console.error(error);
    }
  }

  boot();
})();
