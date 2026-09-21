document.addEventListener("DOMContentLoaded", () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canUseCustomCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReducedMotion;
    const cursor = document.querySelector(".cursor-orb");
    const root = document.documentElement;
    const THEME_KEY = "theme";
    const THEME_COLORS = { light: "#f4f0e6", dark: "#1b2228" };
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const themeToggle = document.querySelector(".theme-toggle");
    const themeLabel = themeToggle ? themeToggle.querySelector(".theme-toggle-text") : null;

    const readStoredTheme = () => {
        try {
            const value = localStorage.getItem(THEME_KEY);
            return value === "light" || value === "dark" ? value : null;
        } catch {
            return null;
        }
    };

    const systemTheme = () => (
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    );

    const applyTheme = (theme, persist) => {
        root.setAttribute("data-theme", theme);
        root.style.colorScheme = theme;
        if (themeMeta) themeMeta.setAttribute("content", THEME_COLORS[theme]);
        if (themeToggle) {
            const next = theme === "dark" ? "light" : "dark";
            themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
            themeToggle.setAttribute("aria-label", `Switch to ${next} appearance`);
            if (themeLabel) themeLabel.textContent = next.charAt(0).toUpperCase() + next.slice(1);
        }
        if (persist) {
            try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore quota / private mode */ }
        }
    };

    applyTheme(readStoredTheme() || systemTheme(), false);

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
            applyTheme(next, true);
        });
    }

    const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = (event) => {
        if (readStoredTheme()) return;
        applyTheme(event.matches ? "dark" : "light", false);
    };
    if (typeof systemDark.addEventListener === "function") {
        systemDark.addEventListener("change", onSystemThemeChange);
    } else if (typeof systemDark.addListener === "function") {
        systemDark.addListener(onSystemThemeChange);
    }

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

    const syncHeaderOffset = () => {
        const height = header ? header.offsetHeight : 76;
        root.style.setProperty("--header-offset", `${height}px`);
        return height + 12;
    };

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
            if (id && link.getAttribute("href") === id) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    };

    const syncActiveNav = () => {
        const offset = headerOffset();
        let activeId = null;

        sectionById.forEach(({ section }, id) => {
            const top = section.getBoundingClientRect().top - offset;
            if (top <= 24) activeId = id;
        });

        setActiveNav(activeId);
    };

    syncHeaderOffset();
    syncActiveNav();
    window.addEventListener("scroll", syncActiveNav, { passive: true });
    window.addEventListener("resize", () => {
        syncHeaderOffset();
        syncActiveNav();
    });

    if (header && typeof ResizeObserver === "function") {
        new ResizeObserver(syncHeaderOffset).observe(header);
    }
});
