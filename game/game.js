document.addEventListener("DOMContentLoaded", () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const kicker = document.querySelector(".scene-kicker");
    const title = document.getElementById("scene-title");
    const agentLine = document.querySelector(".agent-line");
    const body = document.getElementById("scene-body");
    const feedback = document.querySelector(".game-feedback");
    const progress = document.querySelector(".game-progress");
    const keysHint = document.querySelector(".game-keys");
    const dossierEmpty = document.querySelector(".dossier-empty");
    const dossierStack = document.querySelector(".dossier-stack");

    const CHIP_LABELS = ["Live demo", "Measured", "CI"];

    const QUESTS = [
        {
            id: "meeting",
            act: "01",
            title: "Land the meeting",
            kicker: "The desk is on the line",
            agent: "Present tense only. If it isn’t on the sheet, it isn’t in the room.",
            unlocks: "experience",
            beats: [
                {
                    type: "choice",
                    prompt: "They want the current role. What’s on the sheet?",
                    options: [
                        "Independent engineering · Software Engineer · May 2025–present · Remote",
                        "Principal Engineer, still at Accenture",
                        "Staff ML engineer at a lab that isn’t on the résumé",
                    ],
                    correct: 0,
                    hit: "That’s the brief. Independent, present tense, remote.",
                    miss: "Independent engineering, Software Engineer, May 2025–present, Remote. Accenture ended July 2022. Don’t rewrite the dates.",
                },
                {
                    type: "choice",
                    prompt: "One line for the room. No frosting.",
                    options: [
                        "I ship production models that are always right.",
                        "I measure whether a model is actually right, and refuse to act when it is not.",
                        "I run a forty-person platform org.",
                    ],
                    correct: 1,
                    hit: "That’s the line. Don’t upgrade it.",
                    miss: "The site line is the line: measure whether a model is actually right, and refuse to act when it is not.",
                },
                {
                    type: "choice",
                    prompt: "One year in Bangalore. What actually shipped?",
                    options: [
                        "A Python ETL script that saved 50 labor hours monthly and reduced processing errors, plus a GitHub Actions CI/CD pipeline.",
                        "Led a company-wide data platform rewrite as the org owner.",
                        "No Accenture work is listed.",
                    ],
                    correct: 0,
                    hit: "That’s the year. Hours and a pipeline — not a made-up org chart.",
                    miss: "Accenture, Jul 2021–Jul 2022, Bangalore: Python ETL that saved 50 labor hours monthly, and a GitHub Actions CI/CD pipeline.",
                },
                {
                    type: "choice",
                    prompt: "Schooling. Read it back.",
                    options: [
                        "PhD in machine learning, Stanford.",
                        "Self-taught only; no degrees on the sheet.",
                        "MS Computer Science, University of Alabama at Birmingham · 2023–25. BS Computer Science, BV Raju Institute of Technology · 2017–21.",
                    ],
                    correct: 2,
                    hit: "UAB and BV Raju. That’s the education block.",
                    miss: "MS Computer Science, University of Alabama at Birmingham, 2023–25. BS Computer Science, BV Raju Institute of Technology, 2017–21.",
                },
            ],
        },
        {
            id: "upstream",
            act: "02",
            title: "Close the upstream deal",
            kicker: "Two folders on the table",
            agent: "Close what’s real. We don’t claim a merge we didn’t get.",
            unlocks: "opensource",
            beats: [
                {
                    type: "choice",
                    prompt: "better-auth — email enumeration at sign-in. Have I Been Pwned plugin. What’s the close?",
                    options: [
                        "Maintainers adopted the request-scoped skip flag and shipped it in #5998.",
                        "He merged it himself as a better-auth maintainer.",
                        "The PR was closed with no change.",
                    ],
                    correct: 0,
                    hit: "Adopted and shipped in #5998. That’s a close.",
                    miss: "He proposed a request-scoped skip flag and a regression test. Maintainers adopted it and shipped #5998. He is not a maintainer there.",
                },
                {
                    type: "choice",
                    prompt: "go-ethereum — geth db truncate-freezer. Three core-maintainer review rounds. How did it end?",
                    options: [
                        "Merged as written on the first pass.",
                        "The core team built its own version of the command.",
                        "Abandoned; no PR.",
                    ],
                    correct: 1,
                    hit: "They built their own version. That’s the honest end.",
                    miss: "PR #31351 was revised across three rounds. The core team built its own version of the command. Don’t say it merged as written.",
                },
            ],
        },
        {
            id: "reel",
            act: "03",
            title: "Screen the reel",
            kicker: "Four clips. No invented chips.",
            agent: "What / Why / How, then stamp Live, Measured, or CI only if the site already does.",
            unlocks: "projects",
            beats: [
                {
                    type: "reel",
                    name: "llmfr",
                    prompt: "First clip. llmfr. What’s the What?",
                    options: [
                        "LLM Flight Recorder records a local generation step by step so you can replay two runs, name where they first split, and treat later diffs as fallout.",
                        "A hosted leaderboard that ranks every open model by first-divergence accuracy.",
                        "A cloud eval farm that invents logprobs when the API omits them.",
                    ],
                    correct: 0,
                    hit: "That’s the recorder. Local traces. No invented scores.",
                    miss: "llmfr records a local generation step by step so you can replay two runs and name where they first split. The OpenAI adapter fails closed; it does not invent scores.",
                    chips: ["Measured", "CI"],
                    chipHit: "Measured and CI. No live demo URL — don’t invent Live.",
                    chipMiss: "llmfr stamps Measured and CI only. There is no public demo, so Live stays off.",
                    why: "Prompt and final-string logs cannot tell those apart. A string diff treats a sampling split, a truncated window, and downstream fallout as one blob.",
                    how: "Python, Hugging Face transformers, a local SQLite index, and JSON/JSONL traces. Commands: record, compare, replay, study, and batch. Traces stay local. The OpenAI adapter fails closed when the API omits per-token logprob content; it does not invent scores. Llama was not recorded (gated Hub repo; no HF_TOKEN in the capture environment).",
                    evidence: "N=30 Qwen/Qwen2.5-0.5B-Instruct: sampling disagree 10/30, decoding-config disagree 13/30; GS-T22n 2x descriptive label is null (not a p-value). First-divergence class did not predict wrong-answer disagreement here.",
                    links: [
                        { label: "GitHub", href: "https://github.com/sivaratrisrinivas/llm-flight-recorder" },
                        { label: "CI", href: "https://github.com/sivaratrisrinivas/llm-flight-recorder/actions" },
                    ],
                },
                {
                    type: "reel",
                    name: "Bouncer",
                    prompt: "Second clip. Bouncer. What’s the What?",
                    options: [
                        "A production refund bot that cut chargebacks 80%.",
                        "An eval for when an AI agent with write access to a store should be allowed to touch money. Five actions: ACT, REPLY, ASK, ESCALATE, ABSTAIN. Grading is fully deterministic — no LLM judges.",
                        "An LLM-as-judge suite that grades every refund in production.",
                    ],
                    correct: 1,
                    hit: "An eval. Deterministic grading. That’s the clip.",
                    miss: "Bouncer is an eval for when an agent should be allowed to touch money. Five actions, no LLM judges — not a production refund bot.",
                    chips: ["Live demo", "Measured"],
                    chipHit: "Live demo and Measured. No CI chip on the site — don’t add one.",
                    chipMiss: "Bouncer stamps Live demo and Measured. The site does not carry a CI chip on this card.",
                    why: "Before a model refunds, measure Unsafe Action Rate and Valid Automation Rate against a rules baseline.",
                    how: "Python, a rules engine, and OpenAI-compatible adapters. The demo runs rules live and replays committed fixtures for the LLM agents, labeled as such. llama3.1-8b and llama-3.3-70b failed with HTTP 403 error 1010 — no rates.",
                    evidence: "50-case run. Both measured LLMs are about 5x less safe than rules on this set; two points, not a trend. rules live UAR 2.0% (1/50), VAR 100.0% (20/20). cheap gemma-4-31b replay UAR 10.0% (5/50), VAR 85.0% (17/20). strong gpt-oss-120b replay UAR 10.0% (5/50), VAR 60.0% (12/20).",
                    links: [
                        { label: "GitHub", href: "https://github.com/sivaratrisrinivas/bouncer-eval" },
                        { label: "Live demo", href: "https://bouncer-eval.vercel.app" },
                    ],
                },
                {
                    type: "reel",
                    name: "POSTDATED",
                    prompt: "Third clip. POSTDATED. What’s the What?",
                    options: [
                        "Turns photos of hospital discharge paperwork and bills into a predicted, itemised insurance rejection while the paperwork can still be fixed. Each recoverable line becomes one physical ask: a document to request or a question for the doctor.",
                        "A measured 99% insurance-denial predictor used by hospitals.",
                        "An Anthropic / Claude claims engine with a published accuracy score.",
                    ],
                    correct: 0,
                    hit: "Paperwork into a predicted rejection while it can still be fixed. Accuracy unmeasured.",
                    miss: "POSTDATED turns hospital paperwork into predicted disallowances while gaps can still be fixed. There is no Anthropic/Claude client. Prediction accuracy is unmeasured.",
                    chips: ["Live demo", "CI"],
                    chipHit: "Live and CI. Prediction accuracy is unmeasured — Measured stays off.",
                    chipMiss: "POSTDATED stamps Live demo and CI only. Prediction accuracy is unmeasured, so Measured does not go on the card.",
                    why: "Families at the discharge counter need that letter while the doctor and the paperwork are still there.",
                    how: "TypeScript, Next.js 16, React 19, Tailwind CSS 4, Cerebras Chat Completions (gemma-4-31b), and Vitest. Extraction is separated from deterministic policy arithmetic and a negation-aware guard that blocks unsupported medical claims. Phone photos are resized to a 2,576px long edge. There is no Anthropic / Claude client. Prediction accuracy is unmeasured.",
                    evidence: "Selected builder — one of ~150 from 5,000+ applications (≈3%) for the five-hour Push to Prod sprint in Bengaluru. 38 tests on the money and guard paths. Live extraction reports precision, recall, grounding, and abstention separately rather than one headline score.",
                    links: [
                        { label: "GitHub", href: "https://github.com/sivaratrisrinivas/postdated" },
                        { label: "Live demo", href: "https://postdated.vercel.app" },
                        { label: "CI", href: "https://github.com/sivaratrisrinivas/postdated/actions" },
                    ],
                },
                {
                    type: "reel",
                    name: "Fuzz",
                    prompt: "Last clip. Fuzz. What’s the What?",
                    options: [
                        "A server-side reconstruction toy that uploads the original paragraph for the model to copy.",
                        "A real-time text-degradation game: waves scramble a private paragraph, you rewrite to save pieces, and a model reconstructs from what remains. The original text never leaves the browser.",
                        "An image-diffusion playground with a public leaderboard.",
                    ],
                    correct: 1,
                    hit: "The original never leaves the browser. That’s the privacy boundary.",
                    miss: "Fuzz is a real-time text-degradation game. The original text never leaves the browser. Each round makes at most one model call.",
                    chips: ["Live demo", "Measured", "CI"],
                    chipHit: "Live, Measured, and CI. That’s the honest stamp.",
                    chipMiss: "Fuzz stamps Live demo, Measured, and CI — all three are on the site.",
                    why: "Makes diffusion tangible with words instead of pictures — reconstructing from damage is a best guess, not a copy.",
                    how: "Bun and TypeScript on the client; Python/FastAPI helper and Hugging Face inference on the server. Each round makes at most one model call. Only the final fuzz level and newly restored words leave the browser.",
                    evidence: "Qwen2.5-7B-Instruct Q4_K_M, n=4: Word F1 0.876 at fuzz 0.0, 0.124 at 1.0. Fuzz 1.0 Word F1 0.124 is prompt-boilerplate regurgitation. Exact match 0 at every level.",
                    links: [
                        { label: "GitHub", href: "https://github.com/sivaratrisrinivas/fuzz" },
                        { label: "Live demo", href: "https://fuzz-srini5.vercel.app" },
                        { label: "CI", href: "https://github.com/sivaratrisrinivas/fuzz/actions" },
                    ],
                },
            ],
        },
    ];

    const UNLOCKS = {
        experience: {
            heading: "Experience",
            href: "/#experience",
            cards: [
                {
                    title: "Independent engineering",
                    meta: "Software Engineer · May 2025–present · Remote",
                    items: [
                        "Proposed a request-scoped skip flag and regression test for an email-enumeration leak in better-auth; maintainers adopted the approach and shipped it in #5998.",
                        "Designed a go-ethereum archive-node command that binary-searches the merge block, preserves headers and hashes, and drops pre-merge bodies; revised it across three core-maintainer review rounds, after which the core team built its own version.",
                        "Shipped POSTDATED, which turns hospital paperwork into predicted insurance disallowances while recoverable gaps can still be fixed, using Cerebras Chat Completions (gemma-4-31b) for extraction and 38 tests on the money and guard paths.",
                        "Built Fuzz, a real-time text-degradation game that captures restored words at their exact fuzz level; each round makes at most one model call, and the original text never crosses the server boundary.",
                    ],
                },
                {
                    title: "Accenture",
                    meta: "Software Engineer · Jul 2021–Jul 2022 · Bangalore",
                    items: [
                        "Developed a Python ETL script that automated data-processing workflows, saved 50 labor hours monthly, and reduced processing errors.",
                        "Implemented a GitHub Actions CI/CD pipeline.",
                    ],
                },
                {
                    title: "Education",
                    meta: "Degrees",
                    items: [
                        "MS Computer Science — University of Alabama at Birmingham · 2023–25",
                        "BS Computer Science — BV Raju Institute of Technology · 2017–21",
                    ],
                },
            ],
        },
        opensource: {
            heading: "Open source",
            href: "/#open-source",
            cards: [
                {
                    title: "better-auth — email enumeration at sign-in",
                    meta: "2025 · Security · shipped #5998",
                    items: [
                        "Signing in with an unregistered email and a compromised password returned PASSWORD_COMPROMISED instead of the generic error. Traced it to the Have I Been Pwned plugin throwing during the dummy-password hash. Proposed a request-scoped skip flag plus a regression test.",
                        "Status: Maintainers adopted the approach and shipped it in #5998.",
                    ],
                    links: [
                        { label: "Proposal #5973", href: "https://github.com/better-auth/better-auth/pull/5973" },
                        { label: "Shipped #5998", href: "https://github.com/better-auth/better-auth/pull/5998" },
                    ],
                },
                {
                    title: "go-ethereum — geth db truncate-freezer",
                    meta: "2025 · Systems · core team built its own version",
                    items: [
                        "A subcommand for archive nodes that binary-searches the merge block, preserves headers and hashes, and drops pre-merge bodies. Reviewed across three rounds; revised to batch-process rather than hold roughly 15 GB in memory on mainnet.",
                        "Status: The core team built its own version of the command.",
                    ],
                    links: [
                        { label: "PR #31351", href: "https://github.com/ethereum/go-ethereum/pull/31351" },
                    ],
                },
            ],
        },
        projects: {
            heading: "Projects",
            href: "/#work",
            cards: [],
        },
    };

    const state = {
        scene: "intro",
        questIndex: 0,
        beatIndex: 0,
        reelPhase: "what",
        chipSelected: new Set(),
        unlocked: { experience: false, opensource: false, projects: false },
        projectCards: [],
        locked: false,
    };

    const quest = () => QUESTS[state.questIndex];
    const beat = () => quest()?.beats[state.beatIndex];

    const delay = (ms) => new Promise((resolve) => {
        setTimeout(resolve, prefersReducedMotion ? 0 : ms);
    });

    function setFeedback(text, kind) {
        feedback.textContent = text || "";
        feedback.classList.toggle("is-bad", kind === "bad");
    }

    function renderProgress() {
        progress.replaceChildren();
        QUESTS.forEach((item, index) => {
            const mark = document.createElement("span");
            if (state.scene === "finale" || index < state.questIndex || (state.scene === "unlock" && index === state.questIndex)) {
                mark.className = "is-done";
            } else if (state.scene !== "intro" && index === state.questIndex) {
                mark.className = "is-now";
            }
            mark.title = item.title;
            progress.append(mark);
        });
    }

    function optionButton(index, text) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice";
        button.dataset.index = String(index);
        const key = document.createElement("span");
        key.className = "choice-key";
        key.textContent = String(index + 1);
        const label = document.createElement("span");
        label.className = "choice-text";
        label.textContent = text;
        button.append(key, label);
        return button;
    }

    function actionButton(label, className, onClick) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.textContent = label;
        button.addEventListener("click", onClick);
        return button;
    }

    function proofList(chips) {
        const list = document.createElement("ul");
        list.className = "proof-chips";
        list.setAttribute("aria-label", "Proof");
        chips.forEach((chip) => {
            const item = document.createElement("li");
            const mark = document.createElement("span");
            mark.className = "proof-chip";
            mark.textContent = chip;
            item.append(mark);
            list.append(item);
        });
        return list;
    }

    function renderCard(card) {
        const article = document.createElement("article");
        article.className = "dossier-card";
        const heading = document.createElement("h3");
        heading.textContent = card.title;
        article.append(heading);
        if (card.meta) {
            const meta = document.createElement("p");
            meta.className = "dossier-card-meta";
            meta.textContent = card.meta;
            article.append(meta);
        }
        if (card.chips?.length) article.append(proofList(card.chips));
        [["What", card.what], ["Why", card.why], ["How", card.how]].forEach(([label, value]) => {
            if (!value) return;
            const p = document.createElement("p");
            const strong = document.createElement("strong");
            strong.textContent = label;
            p.append(strong, document.createTextNode(" " + value));
            article.append(p);
        });
        if (card.evidence) {
            const p = document.createElement("p");
            p.textContent = card.evidence;
            article.append(p);
        }
        if (card.items?.length) {
            const list = document.createElement("ul");
            card.items.forEach((item) => {
                const li = document.createElement("li");
                li.textContent = item;
                list.append(li);
            });
            article.append(list);
        }
        if (card.links?.length) {
            const nav = document.createElement("div");
            nav.className = "dossier-links";
            card.links.forEach((link) => {
                const a = document.createElement("a");
                a.className = "text-link";
                a.href = link.href;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = link.label;
                nav.append(a);
            });
            article.append(nav);
        }
        return article;
    }

    function renderDossier() {
        dossierStack.replaceChildren();
        const order = ["experience", "opensource", "projects"];
        let any = false;
        order.forEach((key) => {
            if (!state.unlocked[key]) return;
            any = true;
            const pack = UNLOCKS[key];
            const cards = key === "projects" ? state.projectCards : pack.cards;
            cards.forEach((card) => dossierStack.append(renderCard(card)));
        });
        dossierEmpty.hidden = any;
    }

    function focusPrimary() {
        if (state.scene === "intro") return;
        const target = body.querySelector("button:not([disabled]), a.play-cta, a.scene-continue");
        if (target) target.focus();
    }

    function renderIntro() {
        state.scene = "intro";
        kicker.innerHTML = `<span class="call-lamp" aria-hidden="true"></span> A three-act briefing`;
        title.textContent = "The Book";
        agentLine.textContent = "I don’t sell a myth. I book the work. Three rooms: land the meeting, close the upstream deals, screen the reel. If it isn’t on the site, it isn’t in the pitch.";
        body.replaceChildren(actionButton("Let’s get the meeting", "play-cta", startGame));
        keysHint.hidden = false;
        setFeedback("");
        renderProgress();
        focusPrimary();
    }

    function startGame() {
        state.scene = "beat";
        state.questIndex = 0;
        state.beatIndex = 0;
        state.reelPhase = "what";
        state.chipSelected = new Set();
        state.unlocked = { experience: false, opensource: false, projects: false };
        state.projectCards = [];
        state.locked = false;
        renderDossier();
        renderBeat();
    }

    function renderBeat() {
        const currentQuest = quest();
        const currentBeat = beat();
        state.scene = "beat";
        state.locked = false;
        kicker.innerHTML = `<span class="call-lamp" aria-hidden="true"></span> Act ${currentQuest.act} — ${currentQuest.kicker}`;
        title.textContent = currentQuest.title;
        agentLine.textContent = currentQuest.agent;
        keysHint.hidden = false;
        setFeedback("");
        renderProgress();

        if (currentBeat.type === "choice") {
            const prompt = document.createElement("p");
            prompt.className = "scene-prompt";
            prompt.textContent = currentBeat.prompt;
            const list = document.createElement("div");
            list.className = "choice-list";
            list.setAttribute("role", "group");
            list.setAttribute("aria-label", "Answers");
            currentBeat.options.forEach((option, index) => list.append(optionButton(index, option)));
            list.addEventListener("click", (event) => {
                const button = event.target.closest(".choice");
                if (!button || state.locked) return;
                judgeChoice(Number(button.dataset.index));
            });
            body.replaceChildren(prompt, list);
        } else {
            renderReel(currentBeat);
        }
        focusPrimary();
    }

    function renderReel(currentBeat, revealChips = false) {
        const prompt = document.createElement("p");
        prompt.className = "scene-prompt";
        prompt.textContent = revealChips
            ? `Stamp what’s true for ${currentBeat.name}. Live demo, Measured, CI — only if the site already does.`
            : currentBeat.prompt;
        const nodes = [prompt];

        if (!revealChips) {
            const list = document.createElement("div");
            list.className = "choice-list";
            list.setAttribute("role", "group");
            list.setAttribute("aria-label", "Answers");
            currentBeat.options.forEach((option, index) => list.append(optionButton(index, option)));
            list.addEventListener("click", (event) => {
                const button = event.target.closest(".choice");
                if (!button || state.locked) return;
                judgeChoice(Number(button.dataset.index));
            });
            nodes.push(list);
        } else {
            const locked = document.createElement("p");
            locked.className = "locked-what";
            const strong = document.createElement("strong");
            strong.textContent = "What";
            locked.append(strong, document.createTextNode(currentBeat.options[currentBeat.correct]));
            nodes.push(locked);

            const board = document.createElement("div");
            board.className = "chip-board";
            board.setAttribute("role", "group");
            board.setAttribute("aria-label", "Proof chips");
            CHIP_LABELS.forEach((label, index) => {
                const chip = document.createElement("button");
                chip.type = "button";
                chip.className = "chip-toggle";
                chip.dataset.chip = label;
                chip.dataset.index = String(index);
                chip.setAttribute("aria-pressed", state.chipSelected.has(label) ? "true" : "false");
                chip.textContent = `${index + 1} · ${label}`;
                chip.addEventListener("click", () => toggleChip(label));
                board.append(chip);
            });
            nodes.push(board);
            nodes.push(actionButton("Stamp the card", "scene-continue", stampChips));
        }

        body.replaceChildren(...nodes);
        focusPrimary();
    }

    function toggleChip(label) {
        if (state.locked) return;
        if (state.chipSelected.has(label)) state.chipSelected.delete(label);
        else state.chipSelected.add(label);
        body.querySelectorAll(".chip-toggle").forEach((chip) => {
            chip.setAttribute("aria-pressed", state.chipSelected.has(chip.dataset.chip) ? "true" : "false");
        });
    }

    function sameSet(a, b) {
        if (a.size !== b.size) return false;
        for (const value of a) if (!b.has(value)) return false;
        return true;
    }

    async function judgeChoice(index) {
        const currentBeat = beat();
        const buttons = [...body.querySelectorAll(".choice")];
        const chosen = buttons[index];
        if (!chosen || state.locked) return;
        const ok = index === currentBeat.correct;
        if (!ok) {
            chosen.classList.add("is-wrong");
            setFeedback(currentBeat.miss, "bad");
            return;
        }
        state.locked = true;
        buttons.forEach((button, buttonIndex) => {
            button.disabled = true;
            if (buttonIndex === currentBeat.correct) button.classList.add("is-correct");
        });
        setFeedback(currentBeat.hit, "good");
        await delay(720);
        if (currentBeat.type === "reel") {
            state.reelPhase = "chips";
            state.chipSelected = new Set();
            state.locked = false;
            renderReel(currentBeat, true);
            return;
        }
        advanceBeat();
    }

    function stampChips() {
        const currentBeat = beat();
        if (state.locked || currentBeat.type !== "reel") return;
        const expected = new Set(currentBeat.chips);
        if (!sameSet(state.chipSelected, expected)) {
            setFeedback(currentBeat.chipMiss, "bad");
            return;
        }
        state.locked = true;
        setFeedback(currentBeat.chipHit, "good");
        state.projectCards.push({
            title: currentBeat.name,
            chips: currentBeat.chips,
            what: currentBeat.options[currentBeat.correct],
            why: currentBeat.why,
            how: currentBeat.how,
            evidence: currentBeat.evidence,
            links: currentBeat.links,
        });
        delay(720).then(advanceBeat);
    }

    function advanceBeat() {
        state.beatIndex += 1;
        state.reelPhase = "what";
        state.chipSelected = new Set();
        if (state.beatIndex >= quest().beats.length) {
            renderUnlock();
            return;
        }
        renderBeat();
    }

    function renderUnlock() {
        const currentQuest = quest();
        state.scene = "unlock";
        state.unlocked[currentQuest.unlocks] = true;
        renderDossier();
        renderProgress();
        kicker.innerHTML = `<span class="call-lamp" aria-hidden="true"></span> Unlocked`;
        title.textContent = UNLOCKS[currentQuest.unlocks].heading;
        agentLine.textContent = currentQuest.id === "meeting"
            ? "The meeting’s on the book. Roles, dates, schooling — as written."
            : currentQuest.id === "upstream"
                ? "Upstream’s on the book. better-auth shipped; geth’s core team built its own version. No extra shine."
                : "Four clips, stamped honest. The rest of the reel is on the portfolio.";
        const wrap = document.createElement("div");
        wrap.className = "unlock-copy";
        const note = document.createElement("p");
        note.className = "scene-prompt";
        note.textContent = "It’s in the dossier. Same facts as the site.";
        wrap.append(note, actionButton("Continue", "scene-continue", continueAfterUnlock));
        body.replaceChildren(wrap);
        keysHint.hidden = false;
        setFeedback("");
        focusPrimary();
    }

    function continueAfterUnlock() {
        state.questIndex += 1;
        state.beatIndex = 0;
        if (state.questIndex >= QUESTS.length) {
            renderFinale();
            return;
        }
        renderBeat();
    }

    function renderFinale() {
        state.scene = "finale";
        renderProgress();
        kicker.innerHTML = `<span class="call-lamp" aria-hidden="true"></span> The room is yours`;
        title.textContent = "Don’t overtalk it.";
        agentLine.textContent = "They’re in the room. The dossier is the site. He’s available — remote full-time or contract · UTC+5:30. You want the next useful thing, you write.";
        const actions = document.createElement("div");
        actions.className = "scene-actions";
        const mail = document.createElement("a");
        mail.className = "play-cta";
        mail.href = "mailto:srinivassivaratri1122@gmail.com";
        mail.textContent = "Start a conversation";
        actions.append(mail, actionButton("Play again", "scene-continue", startGame));
        const links = document.createElement("div");
        links.className = "finale-links";
        [
            { href: "/#experience", label: "Experience" },
            { href: "/#open-source", label: "Open source" },
            { href: "/#work", label: "Projects" },
            { href: "/", label: "Portfolio" },
        ].forEach((item) => {
            const a = document.createElement("a");
            a.className = "text-link";
            a.href = item.href;
            a.textContent = item.label;
            links.append(a);
        });
        body.replaceChildren(actions, links);
        keysHint.hidden = true;
        setFeedback("Four clips screened. Tiny-lora, SunkeLo, Bingo, and SokoFlow stay on the portfolio.");
        focusPrimary();
    }

    function currentChoices() {
        return [...body.querySelectorAll(".choice:not([disabled])")];
    }

    function onKey(event) {
        const inField = event.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(event.target.tagName);
        if (inField) return;

        if (event.key === "Enter") {
            if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement) return;
            if (state.scene === "intro") {
                event.preventDefault();
                startGame();
                return;
            }
            if (state.scene === "unlock") {
                event.preventDefault();
                continueAfterUnlock();
                return;
            }
            if (state.scene === "beat" && beat()?.type === "reel" && state.reelPhase === "chips") {
                event.preventDefault();
                stampChips();
            }
            return;
        }

        if (state.scene !== "beat" || state.locked) return;

        if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "ArrowRight" || event.key === "ArrowLeft") {
            const pool = beat()?.type === "reel" && state.reelPhase === "chips"
                ? [...body.querySelectorAll(".chip-toggle")]
                : currentChoices();
            if (!pool.length) return;
            event.preventDefault();
            const current = pool.indexOf(document.activeElement);
            const delta = (event.key === "ArrowDown" || event.key === "ArrowRight") ? 1 : -1;
            const next = (current + delta + pool.length) % pool.length;
            pool[next].focus();
            return;
        }

        const number = Number(event.key);
        if (number >= 1 && number <= 3) {
            event.preventDefault();
            if (beat()?.type === "reel" && state.reelPhase === "chips") {
                toggleChip(CHIP_LABELS[number - 1]);
                return;
            }
            const choices = currentChoices();
            if (choices[number - 1]) judgeChoice(number - 1);
        }
    }

    document.addEventListener("keydown", onKey);
    renderDossier();
    renderIntro();
});
