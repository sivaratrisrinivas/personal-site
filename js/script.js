// ===================================
// Minimal Interactions
// ===================================

document.addEventListener("DOMContentLoaded", function () {
    // Smooth scroll for navigation links
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".section");

    navItems.forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href");
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const navHeight = document.querySelector(".nav").offsetHeight;
                const elementPosition =
                    targetSection.getBoundingClientRect().top;
                const offsetPosition =
                    elementPosition + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                });
            }
        });
    });

    // Active navigation on scroll
    function updateActiveNav() {
        let current = "";
        const scrollPosition = window.pageYOffset;

        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const navHeight = document.querySelector(".nav").offsetHeight;

            if (scrollPosition >= sectionTop - navHeight - 100) {
                current = section.getAttribute("id");
            }
        });

        navItems.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${current}`) {
                link.classList.add("active");
            }
        });
    }

    window.addEventListener("scroll", updateActiveNav);
    updateActiveNav(); // Initial call

    // Subtle fade-in animation on scroll
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -100px 0px",
    };

    const fadeInObserver = new IntersectionObserver(function (entries) {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, observerOptions);

    // Apply fade-in to content elements
    const fadeElements = document.querySelectorAll(
        ".content, .expertise-item, .project, .contact-item",
    );

    fadeElements.forEach((element) => {
        element.style.opacity = "0";
        element.style.transform = "translateY(30px)";
        element.style.transition =
            "opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1), transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)";
        fadeInObserver.observe(element);
    });

    // Hero section always visible
    const hero = document.querySelector(".hero");
    if (hero) {
        hero.style.opacity = "1";
        hero.style.transform = "translateY(0)";
    }
});
