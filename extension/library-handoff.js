(() => {
  const marker = "#keep-and-cook-import=";
  const pendingKey = "keep-and-cook:pending-recipe-import";
  const recoveryKey = "keep-and-cook:extension-auth-recovery";
  const validate = (value) => {
    if (!value || typeof value !== "object") throw new Error("Invalid recipe.");
    if (typeof value.title !== "string" || !value.title.trim() || value.title.length > 160) throw new Error("Invalid recipe title.");
    if (typeof value.description !== "string" || !value.description.trim() || value.description.length > 5000) throw new Error("Invalid recipe description.");
    if (!/^https?:$/.test(new URL(value.sourceUrl).protocol)) throw new Error("Invalid source URL.");
    if (!Array.isArray(value.ingredients) || !value.ingredients.length || value.ingredients.length > 100 || value.ingredients.some((item) => !item || typeof item.id !== "string" || typeof item.name !== "string" || item.name.length > 200)) throw new Error("Invalid ingredients.");
    if (!Array.isArray(value.steps) || !value.steps.length || value.steps.length > 100 || value.steps.some((item) => !item || typeof item.id !== "string" || typeof item.text !== "string" || item.text.length > 5000)) throw new Error("Invalid steps.");
    const recipe = { ...value };
    delete recipe.imageUrl;
    return recipe;
  };
  try {
    if (location.pathname === "/extension-import" && location.hash.length > 1 && location.hash.length <= 180001) {
      validate(JSON.parse(decodeURIComponent(location.hash.slice(1))));
      location.replace(`/login${marker}${location.hash.slice(1)}`);
      return;
    }
    if (location.hash.startsWith(marker)) {
      const raw = location.hash.slice(marker.length);
      if (raw.length > 180000) throw new Error("Recipe too large.");
      const recipe = validate(JSON.parse(decodeURIComponent(raw)));
      sessionStorage.setItem(pendingKey, JSON.stringify(recipe));
      const createdAt = Date.now();
      try { localStorage.setItem(recoveryKey, JSON.stringify({ recipe, createdAt })); } catch {}
      const watch = setInterval(() => {
        try {
          if (Date.now() - createdAt > 7 * 86400000 || location.pathname === "/dashboard" && !sessionStorage.getItem(pendingKey)) {
            const recovery = JSON.parse(localStorage.getItem(recoveryKey) || "null");
            if (recovery?.createdAt === createdAt && recovery.recipe?.sourceUrl === recipe.sourceUrl) localStorage.removeItem(recoveryKey);
            clearInterval(watch);
          }
        } catch { clearInterval(watch); }
      }, 1000);
      history.replaceState(null, "", location.pathname + location.search);
    }
    if (location.pathname === "/dashboard") {
      const raw = localStorage.getItem(recoveryKey);
      if (!raw) return;
      const recovery = JSON.parse(raw);
      if (typeof recovery.createdAt === "number" && recovery.createdAt <= Date.now() && Date.now() - recovery.createdAt < 7 * 86400000 && !sessionStorage.getItem(pendingKey)) {
        sessionStorage.setItem(pendingKey, JSON.stringify(validate(recovery.recipe)));
      }
      localStorage.removeItem(recoveryKey);
    }
  } catch (error) { console.error("Keep & Cook recipe transfer failed", error); }
})();
