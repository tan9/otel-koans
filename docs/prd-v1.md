# PRD v1: OpenTelemetry Koans

## Problem Statement

Product managers and non-developers need to understand OpenTelemetry — what it is, how it works, why it matters — without writing production code. There is no interactive, progressive, hands-on way to learn OTel concepts today. Documentation is developer-focused. The Learning OpenTelemetry book is a good start but is text-only and aging.

## Product

A static GitHub Pages site that teaches OpenTelemetry through interactive, progressive koans. No backend. All telemetry data is synthesized. Each koan is its own page, loading only the JS it needs (performance-first).

## Learner

Product manager or non-developer who wants to understand what OpenTelemetry is and how it works. Not learning to code — learning to *see*.

## Tone

Wise man on the hill. Ruby Koans feeling — a little obscure, simple, zen. Each koan opens with a zen-like "why" that states the problem being solved. Not tutorial voice. Not corporate.

## Core Pedagogical Principle: N+1

Each koan introduces exactly ONE new concept beyond the learner's current understanding. No more. This is the most important design constraint. See `context/research/n-plus-1-pedagogy.md` for the full research (Krashen's i+1, Vygotsky's ZPD, Cognitive Load Theory, Scaffolding, Flow Theory).

**The test**: "What is the ONE new thing?" If the answer contains "and," the koan must be split. Never reference concepts from future koans.

## V1 Koans (strictly N+1)

| # | Title | +1 Concept | Builds on |
|---|---|---|---|
| 0 | The Opening | Systems can be observable or silent | (nothing) |
| 1 | Telemetry | Telemetry is data a system emits about itself | 0 |
| 2 | Three Signals | There are three kinds: metrics, traces, logs | 1 |
| 3 | What is a Metric? | A metric is a number that measures something over time | 2 |
| 4 | Kinds of Metrics | Metrics have types: counter, gauge, histogram | 3 |
| 5 | What is a Trace? | A trace follows a single request through the system | 2 |
| 6 | Spans | A trace is made of spans — each span is one step | 5 |
| 7 | What is a Log? | A log record captures a discrete event with context | 2 |
| 8 | Attributes | All signals carry key-value pairs that describe them | 3, 6, 7 |
| 9 | Resources | A resource identifies where the telemetry came from | 8 |
| 10 | Naming Things | Semantic conventions are shared rules for naming | 8 |
| 11 | Instrumentation | You add instrumentation to code to generate telemetry | 2, 8 |
| 12 | What Gets Exported | Instrumented code produces structured data (OTLP) | 11 |
| 13 | Data Formats | The same data can be represented differently | 12 |
| 14 | The Collector | The Collector receives, processes, and exports telemetry | 13 |
| 15 | The Pipeline | The Collector's pipeline is configured with YAML | 14 |
| 16 | Sampling | Sampling decides what to keep vs drop | 15 |
| 17 | Service Maps | Traces reveal which services talk to each other | 6, 14 |
| 18 | Correlation | Signals connect: metric links to trace links to log | 3, 5, 7 |
| 19 | The Full Picture | Following a problem from alert to root cause | 18 |

## Constraints

- Static GitHub Pages — no backend, no server
- All data is synthesized (realistic OTel-shaped data, fake values)
- Separate pages per koan (no monolithic SPA, each page loads only its JS)
- Pseudo-code in editors — illustrative, not runnable
- VSCode-like editor appearance (syntax highlighting, error underlines)
- Custom-built chart components (ECharts, custom SVG) styled like real observability tools
- Technically accurate — all OTel concepts must match current spec
- Non-technical audience — visual indicators, guided experience
- Desktop only

## Future Iterations (Not V1)

- Profiling as a signal
- GenAI/LLM observability
- eBPF/zero-code instrumentation
- Declarative configuration (YAML SDK setup)
- Baggage as a concept
- Span links and async correlation
- More koans per area (depth within each topic)
