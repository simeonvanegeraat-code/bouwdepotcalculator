/**
 * src/js/main.js
 * Entry point. Initialiseert modules.
 */
import { initForm } from "./ui/form.js";
import { initResults } from "./ui/results.js";
import { initChart } from "./ui/chart.js";

// Update jaar in footer
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Initialiseer componenten
initResults(); // Zorgt voor default state in summary
initChart();   // Tekent lege grafiek
initForm();    // Koppelt events en start logica