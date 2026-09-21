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

        document.querySelectorAll("a, button, .project-card, .role-card, .contribution-card").forEach((element) => {
            element.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
            element.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
        });
    }

    const header = document.querySelector(".site-header");
    const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
    const sectionById = new Map(
        navLinks
            .map((link) => {
                const id = link.getAttribute("href");
                const section = id ? document.querySelector(id) : null;
                return section ? [id, { link, section }] : null;
            })
            .filter(Boolean)
    );

    const headerOffset = () => (header ? header.offsetHeight + 12 : 12);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const target = document.querySelector(link.getAttribute("href"));
            if (!target) return;

            event.preventDefault();
            const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();

            window.scrollTo({
                top,
                behavior: prefersReducedMotion ? "auto" : "smooth",
            });
            history.replaceState(null, "", link.getAttribute("href"));
        });
    });

    const setActiveNav = (id) => {
        navLinks.forEach((link) => {
            if (link.getAttribute("href") === id) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    };

    const syncActiveNav = () => {
        if (window.scrollY < 80) {
            navLinks.forEach((link) => link.removeAttribute("aria-current"));
            return;
        }

        const offset = headerOffset();
        let activeId = null;

        sectionById.forEach(({ section }, id) => {
            const top = section.getBoundingClientRect().top - offset;
            if (top <= 24) activeId = id;
        });

        if (activeId) setActiveNav(activeId);
    };

    syncActiveNav();
    window.addEventListener("scroll", syncActiveNav, { passive: true });
    window.addEventListener("resize", syncActiveNav);
});
