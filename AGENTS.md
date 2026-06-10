# AGENTS.md

Guidance for AI agents working in this repository.

## Project status

**Rinumarketing** is a greenfield repository. As of the initial environment setup, the tree contains only `README.md` — no application code, package manifests, Docker config, tests, or CI.

There is nothing to lint, test, build, or run until the product stack is scaffolded.

## Cursor Cloud specific instructions

### Services

| Service | Status | Notes |
|---------|--------|-------|
| *(none)* | N/A | No runnable services are defined in this repo yet. |

### VM tooling (available without repo setup)

The cloud VM provides these runtimes globally; they are not pinned by this repo:

- **Node.js** v22.x with **npm**
- **Python** 3.12
- **git** 2.x

Docker is not installed on the default cloud VM image.

### Dependency refresh

No package manager or lockfile exists. The VM update script is a no-op (`true`) until manifests such as `package.json`, `pyproject.toml`, or similar are added.

### When application code is added

Update this section with concrete commands once the stack exists. Typical additions:

1. Document install command (e.g. `npm install`, `uv sync`).
2. Document dev server start (e.g. `npm run dev`) and port(s).
3. Document lint/test commands (e.g. `npm run lint`, `npm test`).
4. List required environment variables (prefer `.env.example` in the repo).
5. Replace the VM update script with the real install/sync command.

### Git workflow

- Default branch: `main`
- Remote: `https://github.com/joaomolina1/Rinumarketing`
- Agent branches should use the `cursor/<descriptive-name>-344d` naming pattern.
