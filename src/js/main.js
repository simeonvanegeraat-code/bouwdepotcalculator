import { initForm } from './ui/form.js';

// We laden Chart.js in via een script tag in de index.html voor de MVP, 
// of we gaan ervan uit dat het beschikbaar is via Vite/npm.

document.addEventListener('DOMContentLoaded', () => {
    console.log('Bouwdepot Calculator geïnitialiseerd...');

    // Start de formulier logica
    initForm();

    // Smooth scroll voor de nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});