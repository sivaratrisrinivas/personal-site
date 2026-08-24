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

        document.querySelectorAll("a, button, .evidence-row, .project-row").forEach((element) => {
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

    function setupFiltering(sectionSelector, listSelector) {
        const section = document.querySelector(sectionSelector);
        const list = document.querySelector(listSelector);
        if (!section || !list) return;

        const buttons = section.querySelectorAll(".filter-btn");
        const items = list.querySelectorAll("[data-category]");

        const applyFilter = (category) => {
            buttons.forEach((button) => {
                const isActive = button.dataset.filter === category;
                button.classList.toggle("is-active", isActive);
                button.setAttribute("aria-pressed", String(isActive));
            });

            items.forEach((item) => {
                const isMatch = item.dataset.category === category;
                item.hidden = !isMatch;
                item.setAttribute("aria-hidden", String(!isMatch));
            });
        };

        buttons.forEach((button) => {
            button.addEventListener("click", () => applyFilter(button.dataset.filter));
        });

        applyFilter(section.querySelector(".filter-btn.is-active")?.dataset.filter || buttons[0]?.dataset.filter);
    }

    setupFiltering("#open-source", "#opensource-list");
    setupFiltering("#work", "#projects-list");

    const skillCategoryMap = {
        Python: "models-systems",
        Go: "models-systems",
        TypeScript: "eval-safety",
        JavaScript: "retrieval",
        C: "models-systems",
        SQL: "retrieval",
        Linux: "models-systems",
        Docker: "models-systems",
        "CI/CD": "models-systems",
        "HTTP Servers": "retrieval",
        "REST APIs": "retrieval",
        RAG: "retrieval",
        "LLM Integration": "eval-safety",
        "Multimodal AI": "eval-safety",
        "Memory Management": "models-systems",
        PyTorch: "models-systems",
        "sentence-transformers": "retrieval",
        CLIP: "retrieval",
        "hybrid search": "retrieval",
        reranking: "retrieval",
        "eval harness design": "eval-safety",
        "deterministic grading": "eval-safety",
        "golden datasets": "eval-safety",
        "precision/recall/F1": "eval-safety",
        grounding: "eval-safety",
        abstention: "eval-safety",
        "LLM-as-judge tradeoffs": "eval-safety",
    };

    document.querySelectorAll(".skill-tag").forEach((skill) => {
        skill.addEventListener("click", () => {
            document.querySelectorAll(".skill-tag").forEach((tag) => tag.classList.remove("is-selected"));
            skill.classList.add("is-selected");

            const category = skillCategoryMap[skill.dataset.skill];
            const filter = document.querySelector(`#work .filter-btn[data-filter="${category}"]`);
            if (!filter) return;

            filter.click();
            document.querySelector("#work")?.scrollIntoView({
                behavior: prefersReducedMotion ? "auto" : "smooth",
                block: "start",
            });
        });
    });

    const cliDialog = document.querySelector("#cli-dialog");
    const cliInput = document.querySelector("#cli-input");
    const cliOutput = document.querySelector("#cli-output");
    const cliClose = document.querySelector("#cli-close");
    const cliHint = document.querySelector(".cli-hint");

    if (!cliDialog || !cliInput || !cliOutput || !cliClose || !cliHint) return;

    const outputLine = (text, type = "system") => {
        const line = document.createElement("p");
        line.className = `cli-line ${type}`;
        line.textContent = text;
        cliOutput.appendChild(line);
        cliOutput.scrollTop = cliOutput.scrollHeight;
    };

    const outputLink = (text, href) => {
        const line = document.createElement("p");
        const link = document.createElement("a");
        line.className = "cli-line success";
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = text;
        line.appendChild(link);
        cliOutput.appendChild(line);
        cliOutput.scrollTop = cliOutput.scrollHeight;
    };

    const closeCLI = () => {
        if (cliDialog.open) cliDialog.close();
    };

    const openCLI = () => {
        cliDialog.showModal();
        cliInput.value = "";
        cliInput.focus();
        cliHint.setAttribute("aria-expanded", "true");
    };

    const processCommand = (commandLine) => {
        const parts = commandLine.toLowerCase().split(/\s+/);
        const command = parts[0];
        const argument = parts[1];

        switch (command) {
            case "help":
                outputLine("Available commands:", "success");
                outputLine("  about       - Tell me about Srinivas Sivaratri");
                outputLine("  projects    - View the portfolio project list");
                outputLine("  skills      - List core engineering capabilities");
                outputLine("  contact     - View contact coordinates");
                outputLine("  resume      - Open the résumé PDF");
                outputLine("  theme [arg] - Switch between light and dark modes");
                outputLine("  clear       - Wipe the console history");
                outputLine("  close       - Close the console modal");
                break;
            case "about":
                outputLine("Srinivas Sivaratri — Engineering & AI Solutions.", "success");
                outputLine("Autodidact developer focused on AI-assisted engineering, open-source tools, and useful web systems.");
                break;
            case "projects":
                outputLine("Core projects:", "success");
                outputLine("  POSTDATED - Predicts insurance disallowances while paperwork can still be fixed.");
                outputLine("  Bouncer   - Eval for when an agent with write access may touch money.");
                outputLine("  Fuzz      - Scrambled-wave text diffusion reconstruction game.");
                outputLine("  SunkeLo   - Evidence-gated review synthesis.");
                outputLine("Use the category controls on the page for the complete archive.");
                break;
            case "skills":
                outputLine("Technical skills stack:", "success");
                outputLine("  Languages  : Python, Go, TypeScript, JavaScript, C, SQL");
                outputLine("  Platform   : Linux, Docker, CI/CD, REST APIs, HTTP Servers");
                outputLine("  Specialties: RAG, LLM Integration, Multimodal AI, Memory Management");
                break;
            case "contact":
                outputLine("Find Srinivas:", "success");
                outputLine("  Email    : srinivassivaratri1122@gmail.com");
                outputLine("  GitHub   : github.com/sivaratrisrinivas");
                outputLine("  Twitter  : x.com/SrinivasSi78619");
                outputLine("  LinkedIn : linkedin.com/in/srinivas-sivaratri-3a0a32162");
                break;
            case "resume":
                outputLine("Résumé ready:", "success");
                outputLink("Open Srinivas Sivaratri — Résumé (PDF)", "assets/srinivas-sivaratri-resume.pdf");
                break;
            case "theme":
                if (argument === "light" || argument === "dark") {
                    document.body.dataset.theme = argument === "light" ? "light" : "dark";
                    outputLine(`Theme swapped to ${argument}.`, "success");
                } else {
                    outputLine('Error: try "theme light" or "theme dark".', "error");
                }
                break;
            case "clear":
                cliOutput.replaceChildren();
                break;
            case "close":
                closeCLI();
                break;
            default:
                outputLine(`cli: command not found: ${command}. Type 'help' for options.`, "error");
        }
    };

    cliHint.addEventListener("click", openCLI);
    cliClose.addEventListener("click", closeCLI);
    cliDialog.addEventListener("close", () => {
        cliHint.setAttribute("aria-expanded", "false");
        cliHint.focus();
    });
    cliDialog.addEventListener("click", (event) => {
        if (event.target === cliDialog) closeCLI();
    });
    cliInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        const value = cliInput.value.trim();
        cliInput.value = "";
        if (!value) return;
        outputLine(`srinivas:~ $ ${value}`, "user");
        processCommand(value);
    });
    document.addEventListener("keydown", (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            cliDialog.open ? closeCLI() : openCLI();
        }
    });
});
