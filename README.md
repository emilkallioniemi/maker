# MAKER Architecture Exploration

Exploring the **MAKER (Massively Decomposed Agentic Processes)** architecture for executing complex, multi-step AI tasks. This project implements an AI system that solves the Rubik's Cube step by step.

## About MAKER

MAKER decomposes complex tasks into micro-agents, each handling specific subtasks. Through multi-agent voting mechanisms, it ensures error correction at each step, enabling execution of tasks with millions of steps.

## Project Structure

- `packages/core` - MAKER architecture core implementation
- `apps/rubiks-cube` - Rubik's Cube visualization and solving application

## Getting Started

```bash
# Install dependencies
npm install

# Build core package
cd packages/core && npm run build

# Run Rubik's Cube app
cd apps/rubiks-cube && npm run dev
```

## References

- [MAKER Architecture Paper](https://arxiv.org/pdf/2511.09030)
