# Project substance research

Evidence for the P1.2 project substance lines. Every source is a first-party README, configuration file, or implementation file pinned to the repository commit reviewed on 2026-08-13. These are drafts for owner fact-checking; they do not alter the existing simile hooks.

## Fuzz

**Draft substance line:** Bun and TypeScript, with a Python/FastAPI helper and Hugging Face inference. The hard part is degrading text in real time while capturing newly restored words at their exact fuzz level without sending the original text to the server. Each round makes at most one model call; only the final fuzz and fresh clues cross the client boundary.

**Evidence:**

- The [README](https://github.com/sivaratrisrinivas/fuzz/blob/d4a418f89c2e2fd9b1e827f15f7a9bf0f86fa861/README.md) describes the Bun/TypeScript frontend, Python/FastAPI helper, default Qwen model, four-step reconstruction, and privacy boundary.
- [`fuzz-simulator.ts`](https://github.com/sivaratrisrinivas/fuzz/blob/d4a418f89c2e2fd9b1e827f15f7a9bf0f86fa861/box/src/fuzz-simulator.ts) implements wave-by-wave character replacement, deterministic position-driven waves for tests, rewrite acceptance, fresh-clue capture with the current fuzz level, and the restricted `final_fuzz`/`fresh_clues` payload.
- [`reconstruct_coordinator.py`](https://github.com/sivaratrisrinivas/fuzz/blob/d4a418f89c2e2fd9b1e827f15f7a9bf0f86fa861/helper/src/thin_helper/reconstruct_coordinator.py) owns the one-call model boundary, parses the four marked reconstruction steps, and clears request-local references in a `finally` block.
- [`requirements.txt`](https://github.com/sivaratrisrinivas/fuzz/blob/d4a418f89c2e2fd9b1e827f15f7a9bf0f86fa861/helper/requirements.txt) confirms FastAPI, Uvicorn, and `huggingface_hub`; [`package.json`](https://github.com/sivaratrisrinivas/fuzz/blob/d4a418f89c2e2fd9b1e827f15f7a9bf0f86fa861/box/package.json) confirms Bun/TypeScript.

**Uncertainty:** “At most one model call” is exact for the coordinator path, but when no Hugging Face token is configured the implementation returns empty markers and the client uses a local fallback; the sentence deliberately does not claim that every round reaches a hosted model.

## SunkeLo

**Draft substance line:** Next.js, TypeScript, Neon Postgres, Upstash Redis, Sarvam AI, Gemini, and Firecrawl. The hard part is carrying voice input through evidence-gated review synthesis, localization, and text-to-speech while streaming partial results to the browser. It supports 11 languages and caches base reviews and localized results for 30 days.

**Evidence:**

- The [README](https://github.com/sivaratrisrinivas/sunkelo/blob/1e658769e206657a0bcc35d37ad3f3d999b9ef27/README.md) documents the stack, 11-language product scope, voice-to-scrape-to-synthesis-to-translation-to-TTS flow, SSE delivery, and the limitation that public web signals are not a verified-purchaser dataset.
- [`route.ts`](https://github.com/sivaratrisrinivas/sunkelo/blob/1e658769e206657a0bcc35d37ad3f3d999b9ef27/src/app/api/query/route.ts) implements the cache-first request pipeline, speech transcription, entity extraction, source scraping and normalization, evidence checks, synthesis, localization, TTS, and streamed events.
- [`orchestrator.ts`](https://github.com/sivaratrisrinivas/sunkelo/blob/1e658769e206657a0bcc35d37ad3f3d999b9ef27/src/lib/pipeline/orchestrator.ts) implements the `status`, `review`, `audio`, `error`, and `done` Server-Sent Event protocol.
- [`review-evidence.ts`](https://github.com/sivaratrisrinivas/sunkelo/blob/1e658769e206657a0bcc35d37ad3f3d999b9ef27/src/lib/pipeline/review-evidence.ts) implements the optional strict evidence gate over e-commerce domains and textual review signals.
- [`constants.ts`](https://github.com/sivaratrisrinivas/sunkelo/blob/1e658769e206657a0bcc35d37ad3f3d999b9ef27/src/lib/utils/constants.ts) fixes both review cache TTLs at 30 days and also records the five-query daily limit and 30-second/10 MB audio input constraints.
- [`package.json`](https://github.com/sivaratrisrinivas/sunkelo/blob/1e658769e206657a0bcc35d37ad3f3d999b9ef27/package.json) confirms the Next.js/React/TypeScript, Neon, Upstash, Vitest, and Playwright dependencies.

**Uncertainty:** The strict evidence gate is opt-in through `STRICT_REVIEW_EVIDENCE_MODE`; the draft therefore says “evidence-gated” rather than claiming strict mode is always enabled. The README’s “hundreds of reviews” language in the existing hook is not established as a per-query count by the checked-in implementation and should not be repeated as a substance claim.

## SokoFlow

**Draft substance line:** Python, PyTorch, NumPy, and Flask. The hard part is a conditional diffusion policy that combines an 8×8 CNN board encoder with a Transformer action denoiser trained on BFS-derived solutions. It samples four 20-action candidates in 10 DDIM steps and replans for at most 20 iterations.

**Evidence:**

- [`requirements.txt`](https://github.com/sivaratrisrinivas/sokoflow/blob/421ad2335472b4700411f8b5d7c9828a322cf28e/requirements.txt#L1-L4) confirms Python dependencies including PyTorch, NumPy, and Flask.
- [`sokoban_diffusion.py`](https://github.com/sivaratrisrinivas/sokoflow/blob/421ad2335472b4700411f8b5d7c9828a322cf28e/sokoban_diffusion.py#L50-L147) implements the six-channel 8×8 CNN board encoder and Transformer action denoiser; its [sampling path](https://github.com/sivaratrisrinivas/sokoflow/blob/421ad2335472b4700411f8b5d7c9828a322cf28e/sokoban_diffusion.py#L247-L282) uses DDIM-style timestep skipping.
- [`sokoban_data_gen.py`](https://github.com/sivaratrisrinivas/sokoflow/blob/421ad2335472b4700411f8b5d7c9828a322cf28e/sokoban_data_gen.py#L163-L216) generates training trajectories with BFS and caps each search at 30,000 visited states.
- The model’s [training code](https://github.com/sivaratrisrinivas/sokoflow/blob/421ad2335472b4700411f8b5d7c9828a322cf28e/sokoban_diffusion.py#L335-L358) fixes sequences at 20 actions.
- [`app.py`](https://github.com/sivaratrisrinivas/sokoflow/blob/421ad2335472b4700411f8b5d7c9828a322cf28e/app.py#L95-L162) samples four candidates with 10 diffusion steps and limits iterative replanning to 20 rounds.

**Uncertainty:** The [README](https://github.com/sivaratrisrinivas/sokoflow/blob/421ad2335472b4700411f8b5d7c9828a322cf28e/README.md#L67-L71) claims roughly 90%+ success, but the repository has no checked-in evaluation harness or results artifact, so that number should not be published without owner verification. The dataset file cited by the README is absent at this commit. “Optimal” must also be qualified because the BFS data generator has a 30,000-state cap. Inference is diffusion-led but includes deterministic candidate scoring and a one-move escape path.
