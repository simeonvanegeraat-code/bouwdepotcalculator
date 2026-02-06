import { initForm } from "./ui/form.js";
import { initResults } from "./ui/results.js";
import { initChart } from "./ui/chart.js";

function setYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
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

setYear();
smoothAnchors();
initResults();
initChart();
initForm();
