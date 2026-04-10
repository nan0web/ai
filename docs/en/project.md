---
description: Unified AI Kernel for the NaN0Web ecosystem (LLM provider abstraction)
tags: [ai, core, node, llm]
---

# Universal Project Template: @nan0web/ai

> **Purpose:** This package serves as the single standardized interface (kernel) for interacting with language models (LLMs) across the entire `nan.web` ecosystem, abstracting providers and implementing "smart" model selection strategies.

---

## 🧭 Phase 1: Philosophy & Abstraction (The Seed)

1. **Mission and Philosophy:**
   - The package creates Absolute Sovereignty from specific AI providers (OpenAI, Cerebras, HuggingFace, etc.).
   - wE gain the ability to change the system's "mind" (LLM) on the fly without rewriting the business logic of applications. This is a manifestation of the will for code sovereignty.
2. **Abstraction (Base App):**
   - Headless kernel. The package has no UI coupling. It is a pure abstraction of flows (`streamText`, `generateText`), responsible for acquiring knowledge and reporting on resources (`Usage`).
3. **Terminology (Glossary):**
   - `ModelInfo` — model metadata (context limit, pricing, volume).
   - `AiStrategy` — smart model selection along axes (`finance`, `speed`, `volume`, `level`).
   - `Usage` — accounting of resources (tokens).
   - `TestAI` — deterministic mock model for testing without mutating the real world (API).

---

## 📐 Phase 2: Domain Modeling (Data-Driven Models)

1. **Creating Model.js:**
   - Models (`ModelInfo.js`, `Usage.js`, `Pricing.js`) are described as pure data structures. They are the foundation for any interaction.
   - Model metadata is used for automatic selection (`AiStrategy`), not just for visualization.
2. **Metadata Types (`@type`):**
   - For now, the package operates with pure JS abstractions without UI annotations (`@type`), as it is a fundamental kernel for other packages in the ecosystem.
3. **Data Sources:**
   - No dedicated databases. The data consists of provider configurations and environment variables. Providers are registered on the fly (`ModelProvider`).
4. **Vector Indexing (Sovereign Cache):**
   - Indexing leverages `VectorDB` and chunk-level caching (`MarkdownIndexer`). Checksums are stored for each individual chunk.
   - This prevents wasteful LLM embedding requests by re-indexing only the modified blocks.

---

## 🛠 Phase 3: Logic Verification (CLI-First)

1. **Integration with `ui-cli`:**
   - This phase within the package itself is implemented via pure functions and 100% unit test coverage using `node --test` and `TestAI`. CLI interfaces are implemented by consumers (e.g., via `ui-cli`).
   - `TestAI` ensures that application logic depending on this package can be tested in isolation and at zero cost.

---

## 🪐 Phase 4: Sovereign Workbench (The Master IDE)

_This phase is currently not implemented in the package._
Since `@nan0web/ai` is an abstract kernel, it does not currently have its own UI sandbox. Its abstractions and models are used in the Master IDEs of other packages and applications within the `nan.web` ecosystem (e.g., for code or content generation).

---

## 🎨 Phase 5: Theming & Interface (Theming)

_This phase is currently not implemented in the package._
The `@nan0web/ai` package contains no UI/CSS. The separation of logic from brand here is absolute: the package is pure logic, entirely devoid of visual representation. Branding or rendering is implemented exclusively by consumer packages.
