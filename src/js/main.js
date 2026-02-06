// Commit 1: only UI wiring (no calculations yet)

function setYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

function enableTaxSelect() {
  const toggle = document.getElementById("tax-toggle");
  const select = document.getElementById("tax-rate");
  if (!toggle || !select) return;

  const sync = () => {
    select.disabled = !toggle.checked;
  };

  toggle.addEventListener("change", sync);
  sync();
}

function smoothAnchors() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const id = a.getAttribute("href");
    if (!id || id === "#") return;

    const el = document.querySelector(id);
    if (!el) return;

    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", id);
  });
}

function disableCalcButtonForNow() {
  const btn = document.getElementById("btn-calc");
  if (btn) btn.disabled = true;

  const form = document.getElementById("calc-form");
  if (form) {
    form.addEventListener("submit", (e) => e.preventDefault());
  }
}

setYear();
enableTaxSelect();
smoothAnchors();
disableCalcButtonForNow();
