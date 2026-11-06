// Petits comportements du site, sans dépendance.

// Année courante dans le pied de page
document.querySelectorAll("[data-annee]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// Menu mobile : un bouton [data-menu-bouton] ouvre/ferme l'élément [data-menu]
const boutonMenu = document.querySelector("[data-menu-bouton]");
const menu = document.querySelector("[data-menu]");
if (boutonMenu && menu) {
  boutonMenu.addEventListener("click", () => {
    const ouvert = boutonMenu.getAttribute("aria-expanded") === "true";
    boutonMenu.setAttribute("aria-expanded", String(!ouvert));
    menu.classList.toggle("ouvert", !ouvert);
  });
}
