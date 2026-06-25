// Global JS — mobile nav toggle and shared behaviours
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const navLinks = document.getElementById('nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            const open = navLinks.classList.toggle('nav-active');
            menuBtn.innerHTML = open ? '&#10005;' : '&#9776;';
            menuBtn.setAttribute('aria-expanded', open);
        });

        // Close on nav link click (mobile)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('nav-active');
                menuBtn.innerHTML = '&#9776;';
                menuBtn.setAttribute('aria-expanded', false);
            });
        });
    }
});
