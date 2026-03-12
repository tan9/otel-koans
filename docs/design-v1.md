# Design v1: OpenTelemetry Koans

## Tech Stack

| Component | Choice | Size (gzipped) | Why |
|---|---|---|---|
| Code editor | CodeMirror 6 | ~120 KB | VSCode-like look, native squiggly underlines via `@codemirror/lint`, custom pseudo-code language, 15x smaller than Monaco |
| Time series / metrics charts | ECharts (tree-shaken) | ~50-60 KB per page | Grafana-like out of the box, dataZoom, tooltips, dark theme |
| Service map / topology | ECharts graph | ~60-70 KB | Native force-directed layout, same API as metrics charts |
| Trace waterfall | Custom SVG | ~0 KB (vanilla) | Structurally simple (positioned rectangles). A library is overhead. |
| YAML editor (collector koan) | CodeMirror 6 with YAML mode | ~120 KB | Same editor, different language mode |

Each page loads only what it needs. Heaviest page ~120 KB gz. Most well under 100 KB.

## Architecture

- Static GitHub Pages
- Separate HTML page per koan
- No SPA framework — each page loads only its JS
- Shared CSS for consistent dark theme and typography
- Synthetic data embedded in each page (no fetches)

## Koan Designs

### Koan 0: The Opening

> *"A system ran for a thousand days without error. On the thousand-and-first day, it failed. The developer asked, 'When did this begin?' But the system had never learned to speak."*

**Interaction**: Minimal. A dark page with the koan text. Below, a silhouette of interconnected services, all grey/dim. The learner clicks, and services light up one by one — traces flow between them, metrics pulse, logs appear. The system goes from silent to observable.

**What the learner does**: One click. Maybe two.
**What they learn**: The *feeling* of observability. Why it matters.
**JS dependencies**: None or minimal (CSS animations, maybe tiny SVG animation).

---

### Koan 1: Signals

> *"The farmer watches the sky and asks three questions: How hot is it? Which way does the wind blow? What happened last night? No single answer tells the whole story."*

**Interaction**: Three panels showing the same synthetic microservice scenario (an API endpoint slowing down). Each panel shows it through a different signal:
- **Metrics panel**: Time series chart showing request latency climbing. The *what*.
- **Traces panel**: Simplified waterfall showing request path. The *where* — database call is slow.
- **Logs panel**: Structured log entries. The *context* — "connection pool exhausted."

The learner is asked questions ("Which signal tells you *where* the problem is?") and clicks the right panel. Or: all three dimmed, revealed one at a time guided by questions.

**What they learn**: Three signals answer different questions. You need all three.
**JS dependencies**: ECharts (time series), custom SVG (waterfall), styled HTML (logs).

---

### Koan 2: Data Types

> *"A counter counts footsteps. It only goes forward. A gauge reads the temperature — it rises, it falls. A histogram remembers not just the average journey, but the shape of all journeys."*

**Interaction**: Three interactive visualizations, one per metric type:
- **Counter**: Animated counter incrementing. Learner tries to decrement — it won't. Visual "aha."
- **Gauge**: Dial/thermometer that goes up and down as learner drags slider (simulating CPU usage).
- **Histogram**: Buckets fill as synthetic requests arrive. Learner drags percentile marker (p50, p95, p99) and sees where it falls in the distribution.

Below: a span structure explorer (collapsible tree showing traceId, spanId, name, kind, startTime, duration, attributes, events). Same for a log record.

**What they learn**: Metric types have shapes that determine what questions you can ask. Spans and logs have structure.
**JS dependencies**: ECharts (histogram), custom SVG/CSS (counter, gauge, span tree).

---

### Koan 3: Data Formats

> *"The same truth can be spoken in many tongues. The listener must choose which tongue to hear."*

**Interaction**: A single synthetic metric (`http.server.request.duration` histogram) displayed center. Toggle buttons switch between:
- **OTLP JSON** — full protobuf-mapped JSON structure
- **OTLP Protobuf** — hex/binary representation (for flavor)
- **Prometheus exposition** — text-based scrape format

Displays are syntax-highlighted (CodeMirror, read-only). Key fields highlighted/linked across formats — "this field here is the same as that field there."

Exercise: pick which format for a scenario ("Your backend only speaks Prometheus. Which format?").

**What they learn**: OTLP is the native format. Same data, different shapes depending on destination.
**JS dependencies**: CodeMirror 6 (read-only, JSON/YAML highlighting).

---

### Koan 4: Instrumentation

> *"The system is silent until you teach it to speak. A single line of intention can illuminate a thousand requests."*

**Interaction**: VSCode-like CodeMirror editor with pseudo-code for a simple service (~15 lines):

```
function processOrder(order):
    validate(order)
    charge(order.payment)
    ship(order.items)
    return confirmation
```

Below: animated flow diagram (app → collector → backend). Initially grey/empty — nothing emitted.

Squiggly underlines on uninstrumented lines with hints ("This function does important work but emits no telemetry"). Learner adds pseudo-instrumentation (`span.start("processOrder")`, `metric.increment("orders.processed")`). As they add correct lines, the flow lights up — data flows, backend shows traces and metrics.

**What they learn**: Instrumentation is deliberate. You choose what to illuminate.
**JS dependencies**: CodeMirror 6 (custom pseudo-code language, lint/diagnostics), custom SVG (animated flow).

---

### Koan 5: Semantics

> *"A name without meaning is just noise. Call it 'duration' and you know nothing. Call it 'http.server.request.duration' and you know the world."*

**Interaction**: CodeMirror editor with code that has instrumentation but bad attribute names (`time`, `err`, `svc`, `thing`). Below: a query panel that tries questions like "Show me request duration by service" — fails because names are meaningless.

Learner renames attributes to OTel semantic conventions (`http.request.method`, `service.name`, `error.type`). As they fix names, queries work, charts populate.

**What they learn**: Semantic conventions make data queryable and interoperable. Naming matters.
**JS dependencies**: CodeMirror 6 (diagnostics), ECharts (query result charts).

---

### Koan 6: Collector

> *"Data must travel from where it's born to where it's understood. The path it takes determines what arrives."*

**Interaction**: YAML editor (CodeMirror) showing collector config: `receivers`, `processors`, `exporters`, `pipelines`. Visual pipeline diagram beside it showing data flowing through stages.

Tasks:
1. Add a batch processor — see data bundle before export
2. Change exporter to different backend — see data route change
3. Add a filter processor — see data get dropped

Each YAML edit updates the visual pipeline in real time.

**What they learn**: The collector is configurable infrastructure. You control what happens between creation and storage.
**JS dependencies**: CodeMirror 6 (YAML mode), custom SVG (pipeline diagram).

---

### Koan 7: Sampling

> *"You cannot keep every grain of sand that passes through your hands. The question is not whether to let some fall — it is which to hold."*

**Interaction**: Visual stream of synthetic requests flowing left to right (animated dots). Some are errors (red), some slow (orange), most normal (green/grey). Cost meter climbing.

Controls:
- **Head sampling slider**: "Keep 1 in N" — traces disappear, cost drops, but some red/orange vanish.
- **Tail sampling toggle**: "Keep all errors and slow requests" — red/orange survive, cost lower than 100%.
- Question: "An error was sampled out. A customer reports it. Can you find it?" — the tradeoff.

**What they learn**: Sampling reduces cost but loses data. Tail sampling is smarter but more complex. Always a tradeoff.
**JS dependencies**: Custom SVG/Canvas (animated stream), basic sliders/toggles.

---

### Koan 8: Topology

> *"No service is an island. Each request is a journey through many hands. To understand the failure, you must see the map."*

**Interaction**: ECharts force-directed graph with ~8 synthetic services (API Gateway → Auth → Orders → Inventory → Payment → Shipping → Database → Cache). Edges show request flow with animated dots. All green.

Then: something breaks. One service goes red. Learner clicks — sees error rate, latency tooltip. Clicks an edge — sees request count, error percentage. Question: "Where is the problem? Is it the red service, or the one calling it?" (downstream failure makes upstream look broken.)

**What they learn**: Topology shows dependencies. Problems cascade. Root cause isn't always where the symptom appears.
**JS dependencies**: ECharts (graph type).

---

### Koan 9: Analysis

> *"The answer is in the data, if you know how to ask. A number alone is a fact. A number in context is wisdom."*

**Interaction**: The culmination. A mini-dashboard:
1. **Time series panel** (ECharts): `http.server.request.duration` p99 over time. A spike visible.
2. **Exemplar dot** on the spike — learner clicks it.
3. **Trace waterfall** (custom SVG) appears: full request path for that specific slow request. One span suspiciously long.
4. **Logs panel**: filtered to that trace ID — "connection timeout to database."

Learner follows the breadcrumb: metric → exemplar → trace → log. Each click reveals the next layer.

**What they learn**: The power of correlated observability. Metrics = *something is wrong*. Traces = *where*. Logs = *why*. Exemplars are the link.
**JS dependencies**: ECharts (time series), custom SVG (waterfall), styled HTML (logs).
