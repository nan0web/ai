[Українська](./task.md) | [English](./task.en.md)

# Release v1.2.0 (HNSWLib Vector RAG & MCP Server)

## Scope
This release adds a vector search system to the `@nan0web/ai` package powered by `hnswlib-node` and local embeddings (via LM Studio / llama.cpp — `multilingual-e5-large-instruct-q8_0.gguf`). It integrates this system via an MCP server, allowing Antigravity or any agent to discover necessary `.md` context without hallucinations and without parsing the entire monorepo sequentially.

### Implementation Details based on user audio:
1. **Embeddings:** We will utilize the user's existing local server to generate vectors (e.g. LM Studio / llama.cpp at `http://localhost:1234/v1/embeddings`), since the `e5-large` model is already running there. We will NOT use `Transformers.js` to avoid bloating the Node.js package with model weights.
2. **Database (`vector-space.bin`)**: We index using a **single global index** for the entire workspace (e.g., stored in `.datasets/workspace-index.bin`) instead of separate per-package datasets. This gives the agent a cross-package contextual understanding out of the box (e.g., retrieving workflows from `.agents/workflows` regardless of the current package).
3. **Chunking**: The `MarkdownIndexer` utility will split large Markdown files intelligently. Instead of dumping a 20KB file as one huge chunk (which dilutes focus), we will split it by headers (H2, H3), merging very small sections or dividing blocks larger than ~800 tokens (~3000 chars) with a 200 character overlap to maintain semantic continuity.
4. **Temperature & Recursion Control**: Settings for `temperature: 0` and `repetition_penalty: 1.15` will be added to the generator configuration options in `AI.js` to prevent the agent from getting stuck in recursive loops.

## Acceptance criteria (Definition of Done)
1. **VectorDB class**: Wrapper class over `hnswlib-node` created. Supports save/load index and `k-NN` operations.
2. **Embedder class**: Class to generate vectors using OpenAI-compatible API (e.g. localhost:1234/v1/embeddings).
3. **Markdown Chunking**: Function available to chunk MD files by headers/paragraphs with overlap logic.
4. **MCP Server**: `src/bin/mcp-server.js` created using stdio transport. Exposes the `search_knowledge_base` Tool.
5. All contract tests (`task.spec.js`) pass (Red -> Green).

## Architecture Audit Checklist:
  - [x] Are Ecosystem Indexes read? Yes, `index.md` from other packages will be covered by this RAG system.
  - [x] Existing analogs in packages? None, this is the first integration of hnswlib.
  - [x] Data formats: Markdown (`.md`).
  - [x] Deep Linking compliant? Not applicable for backend MCP.
