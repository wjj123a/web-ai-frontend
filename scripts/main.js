const hero = document.querySelector("[data-hero]");
const tabs = document.querySelectorAll(".hero-tab");
const heroNote = document.querySelector("[data-hero-note]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("is-active"));
    tab.classList.add("is-active");

    if (hero) {
      hero.dataset.mode = tab.dataset.mode ?? "ai";
    }

    if (heroNote && tab.dataset.note) {
      heroNote.textContent = tab.dataset.note;
    }
  });
});

if (menuToggle && mobileMenu) {
  mobileMenu.inert = true;

  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    mobileMenu.inert = true;
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu.classList.toggle("is-open", !isOpen);
    mobileMenu.setAttribute("aria-hidden", String(isOpen));
    mobileMenu.inert = isOpen;
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1080) {
      closeMenu();
    }
  });
}

if (hero && !reduceMotion.matches && window.matchMedia("(pointer: fine)").matches) {
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    hero.style.setProperty("--pointer-x", x.toFixed(3));
    hero.style.setProperty("--pointer-y", y.toFixed(3));
  });

  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--pointer-x", "0");
    hero.style.setProperty("--pointer-y", "0");
  });
}
