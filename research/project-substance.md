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

## catBox

**Draft substance line:** Python, PyTorch, Diffusers, and Stable Diffusion Turbo. The hard part is capturing and serving real intermediate denoising frames while leaving outcome selection authoritative on the backend. Both outcome branches use a 512px, six-step image-to-image run, and only the selected branch is generated.

**Evidence:**

- The [README](https://github.com/sivaratrisrinivas/catBox/blob/0035cb72f6213f80780d5518a4b27b0ec7075de4/README.md) describes the persistent `stabilityai/sd-turbo` runner, backend-owned outcome choice, development-only seed/outcome controls, real intermediate trace polling, ephemeral output, and tuned six-step 512px defaults.
- [`sd_turbo_runner.py`](https://github.com/sivaratrisrinivas/catBox/blob/0035cb72f6213f80780d5518a4b27b0ec7075de4/catbox/sd_turbo_runner.py) defines the branch-specific prompts and defaults, seeds the generator, invokes one img2img pipeline, decodes per-step latent frames, and writes trace frames beneath the runtime directory.
- [`model_backend.py`](https://github.com/sivaratrisrinivas/catBox/blob/0035cb72f6213f80780d5518a4b27b0ec7075de4/catbox/model_backend.py) makes the server choose `living` or `dead` on the normal path and reports generated outcomes, trace references, or explicit generation failures.
- The [single-branch trace ADR](https://github.com/sivaratrisrinivas/catBox/blob/0035cb72f6213f80780d5518a4b27b0ec7075de4/docs/adr/0007-single-branch-captured-denoising-trace.md) explicitly records the tradeoff: show real frames for the selected path instead of doubling inference work to stage both branches.
- [`pyproject.toml`](https://github.com/sivaratrisrinivas/catBox/blob/0035cb72f6213f80780d5518a4b27b0ec7075de4/pyproject.toml) confirms Python 3.12+, PyTorch, Diffusers, Transformers, Pillow, and CUDA 12.1 wheels.

**Uncertainty:** The README calls these the “current tuned defaults,” but also documents manual GPU validation and allows development overrides. The six-step/512px claim describes checked-in defaults, not a measured production SLA.

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

## Fixer

**Draft substance line:** Python, Gemini 2.0 Flash, `google-genai`, and `python-dotenv`. The hard part is a function-calling loop that returns filesystem and execution results to the model while injecting a working-directory boundary. It exposes four tools, caps the agent at 20 model turns, and limits Python execution to 30 seconds.

**Evidence:**

- [`requirements.txt`](https://github.com/sivaratrisrinivas/Fixer/blob/9fbae7a994325dd73027d031a588fad5ffa2fe5c/requirements.txt#L1-L2) confirms `google-genai` and `python-dotenv`.
- [`main.py`](https://github.com/sivaratrisrinivas/Fixer/blob/9fbae7a994325dd73027d031a588fad5ffa2fe5c/main.py#L38-L64) selects Gemini 2.0 Flash and caps the model/tool loop at 20 turns.
- [`call_function.py`](https://github.com/sivaratrisrinivas/Fixer/blob/9fbae7a994325dd73027d031a588fad5ffa2fe5c/call_function.py#L9-L50) registers four tools and injects the working directory into each tool call.
- [`prompts.py`](https://github.com/sivaratrisrinivas/Fixer/blob/9fbae7a994325dd73027d031a588fad5ffa2fe5c/prompts.py#L3-L35) adds a dynamic project tree to the system context.
- [`run_python.py`](https://github.com/sivaratrisrinivas/Fixer/blob/9fbae7a994325dd73027d031a588fad5ffa2fe5c/functions/run_python.py#L5-L35) restricts execution to Python files and sets a 30-second subprocess timeout; [`get_file_content.py`](https://github.com/sivaratrisrinivas/Fixer/blob/9fbae7a994325dd73027d031a588fad5ffa2fe5c/functions/get_file_content.py#L5-L19) truncates reads at 10,000 characters.

**Uncertainty:** Do not describe Fixer as a secure sandbox. The containment in [`write_file.py`](https://github.com/sivaratrisrinivas/Fixer/blob/9fbae7a994325dd73027d031a588fad5ffa2fe5c/functions/write_file.py#L4-L18) relies on string-prefix checks rather than resolved-path/common-path validation. It is a one-shot terminal command with an internal loop, not a persistent interactive chat, and the repository’s only checked-in test is a calculator unit test.

## POSTDATED

**Draft substance line:** TypeScript, Next.js 16, React 19, Tailwind CSS 4, the Anthropic SDK, and Vitest. The hard part is separating multimodal document extraction from deterministic policy arithmetic and a negation-aware guard that blocks unsupported medical claims. The money and guard paths have 38 tests, and phone photos are resized to a 2,576px long edge before upload.

**Evidence:**

- [`package.json`](https://github.com/sivaratrisrinivas/postdated/blob/a88a94b766c093b2ca5a3e4f7be1756ce7baaf11/package.json#L5-L27) confirms the framework, UI, Anthropic, and test dependencies and exact checked-in versions.
- The [extraction route](https://github.com/sivaratrisrinivas/postdated/blob/a88a94b766c093b2ca5a3e4f7be1756ce7baaf11/app/api/extract/route.ts#L122-L184) sends the image to Anthropic for strict JSON extraction; the route’s [module boundary](https://github.com/sivaratrisrinivas/postdated/blob/a88a94b766c093b2ca5a3e4f7be1756ce7baaf11/app/api/extract/route.ts#L6-L21) explicitly excludes rupee calculations.
- [`deduct.ts`](https://github.com/sivaratrisrinivas/postdated/blob/a88a94b766c093b2ca5a3e4f7be1756ce7baaf11/lib/deduct.ts#L6-L42) implements deterministic claim arithmetic, residual clamping, and forward dating; it also [removes duplicated total rows arithmetically](https://github.com/sivaratrisrinivas/postdated/blob/a88a94b766c093b2ca5a3e4f7be1756ce7baaf11/lib/deduct.ts#L200-L214).
- [`guard.ts`](https://github.com/sivaratrisrinivas/postdated/blob/a88a94b766c093b2ca5a3e4f7be1756ce7baaf11/lib/guard.ts#L63-L115) implements negation-aware medical claim checks and its [blocking decision](https://github.com/sivaratrisrinivas/postdated/blob/a88a94b766c093b2ca5a3e4f7be1756ce7baaf11/lib/guard.ts#L152-L181).
- The [README test inventory](https://github.com/sivaratrisrinivas/postdated/blob/a88a94b766c093b2ca5a3e4f7be1756ce7baaf11/README.md#L199-L212) records 24 arithmetic tests and 14 guard tests.
- [`compress.ts`](https://github.com/sivaratrisrinivas/postdated/blob/a88a94b766c093b2ca5a3e4f7be1756ce7baaf11/lib/compress.ts#L1-L40) resizes uploads to a maximum 2,576px long edge and emits JPEG at quality 0.85.

**Uncertainty:** The product is deployed at [postdated.vercel.app](https://postdated.vercel.app) according to the [README](https://github.com/sivaratrisrinivas/postdated/blob/a88a94b766c093b2ca5a3e4f7be1756ce7baaf11/README.md#L3-L9), but runtime availability still needs a direct check. No usage number is documented. The README is a suitable long-form design write-up, but it explicitly says the model is based on one hand-read policy and prediction accuracy is unmeasured; copy should preserve that limitation. English, Kannada, and Hindi asks exist, but [`asks.ts`](https://github.com/sivaratrisrinivas/postdated/blob/a88a94b766c093b2ca5a3e4f7be1756ce7baaf11/lib/asks.ts#L3-L16) says Kannada and Hindi have not been checked by native speakers.
