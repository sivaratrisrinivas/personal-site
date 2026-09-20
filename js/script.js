document.addEventListener("DOMContentLoaded", () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canUseCustomCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReducedMotion;
    const cursor = document.querySelector(".cursor-orb");
    const root = document.documentElement;

    if (canUseCustomCursor && cursor) {
        document.body.classList.add("custom-cursor-enabled");
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let cursorX = mouseX;
        let cursorY = mouseY;

        document.addEventListener("mousemove", (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
            root.style.setProperty("--mouse-x", `${mouseX}px`);
            root.style.setProperty("--mouse-y", `${mouseY}px`);
            root.style.setProperty("--cursor-x", `${mouseX}px`);
            root.style.setProperty("--cursor-y", `${mouseY}px`);
            document.body.classList.add("cursor-ready");
        });

        const moveCursor = () => {
            cursorX += (mouseX - cursorX) * 0.16;
            cursorY += (mouseY - cursorY) * 0.16;
            root.style.setProperty("--cursor-x", `${cursorX}px`);
            root.style.setProperty("--cursor-y", `${cursorY}px`);
            requestAnimationFrame(moveCursor);
        };

        moveCursor();

        document.querySelectorAll("a, button, .project-card").forEach((element) => {
            element.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
            element.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const target = document.querySelector(link.getAttribute("href"));
            if (!target) return;

            event.preventDefault();
            const header = document.querySelector(".site-header");
            const offset = header ? header.offsetHeight + 12 : 12;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;

            window.scrollTo({
                top,
                behavior: prefersReducedMotion ? "auto" : "smooth",
            });
            history.replaceState(null, "", link.getAttribute("href"));
        });
    });
});
