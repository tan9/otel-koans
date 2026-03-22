# Contributing Translations

Thank you for helping translate OpenTelemetry Koans!

## How it works

All translatable text lives in JSON files under `site/i18n/`. Each file is one locale:

```
site/i18n/
├── en-US.json    ← English (reference)
├── zh-TW.json    ← Traditional Chinese (Taiwan)
├── zh-CN.json    ← Simplified Chinese
├── ja-JP.json    ← Japanese
└── ...
```

The `en-US.json` file is the source of truth. Each translation file has the same keys — you only change the values.

## Adding a new language

1. Copy `en-US.json` to a new file named with your [BCP 47](https://www.rfc-editor.org/info/bcp47) locale code (e.g. `es-ES.json`, `fr-FR.json`)
2. Translate all values. Do not change the keys.
3. Register the locale in `site/js/i18n.js` — add an entry to the `SUPPORTED` array:
   ```javascript
   { code: 'es-ES', name: 'Español' }
   ```
4. If your language shares a base tag with an existing locale (e.g. adding `pt-PT` when `pt-BR` exists), you may need to add detection logic in `detectLocale()` — see the `zh-*` handling as an example.
5. Open a PR

## Translation guidelines

### Basics

- **Translate values, not keys.** Keys like `"koan01.title"` stay exactly as they are.
- **Keep `\n`** for line breaks inside zen quotes and multi-line text. The i18n engine converts them to `<br>`.
- **Keep `{placeholder}` tokens** like `{count}`, `{kept}`, `{team}` — they get replaced with dynamic values at runtime.
- **Keep HTML tags** like `<strong>`, `<em>`, `<br>`, `<span class="...">` in values that already have them.

### Technical terms

- **Do not translate** terms that appear as code: service names (`gateway`, `api`), OTel attribute names (`http.route`, `service.name`), protocol names (`OTLP`), tool names (`Jaeger`, `Prometheus`).
- **OTel concept names** (`Metric`, `Trace`, `Log`, `Span`, `Attribute`, `Resource`, `Collector`, `Pipeline`, etc.) — follow whatever convention your locale has established. Some locales keep them in English, others translate them.

### Text set by JavaScript

Some text (feedback messages, hints, animation explanations) is set dynamically by JavaScript using `i18n.applyText()` / `i18n.applyHtml()`. These mark elements with `data-i18n` / `data-i18n-html` so they update automatically when the user switches locale. If you add new interactive content, use these helpers instead of setting `textContent` / `innerHTML` directly:

```javascript
// ✓ Good — re-translates on locale switch
i18n.applyText(el, 'koan01.q1Correct');
i18n.applyHtml(el, 'koan01.q1Correct');

// ✓ With dynamic values — use the optional transform parameter.
//   The transform is stored and re-invoked on locale switch,
//   so both the translation and dynamic values stay correct.
i18n.applyText(el, 'koan11.echoPrefix', function(v) { return v + name; });
i18n.applyText(el, 'koan16.connectionTemplate', function(v) {
    return v.replace('{count}', count);
});

// ✗ Avoid — won't update on locale switch
el.textContent = i18n.t('koan01.q1Correct');
```

> **Note:** This project uses ES5 style (`var`, `function() {}`) throughout. Please avoid arrow functions, `const`/`let`, and template literals to maintain consistency.

## JSON structure

Keys are organized by page:

```json
{
  "common": { "shared strings across all pages" },
  "cert":   { "certificate / share feature" },
  "nav":    { "navigation dot tooltips" },
  "index":  { "landing page" },
  "koan01": { "first koan" },
  "koan02": { "second koan" },
  ...
}
```

## Testing locally

```bash
# Install dependencies (first time only)
npm install

# Run all tests — checks missing keys, extra keys, placeholder
# preservation, broken i18n patterns, HTML structure, and more
npm test

# Serve the site for manual testing
npx serve site -l 8000
# Open http://localhost:8000
# Click the language icon (文A) in the bottom bar to switch languages
```

## What the tests check

`npm test` runs 829 tests across 4 suites. All must pass before a PR can merge:

- **Locale consistency** — every key in `en-US.json` exists in your locale, no extra keys, all `{placeholder}` tokens preserved
- **Static analysis** — catches broken `applyText`/`applyHtml` call patterns (e.g., semicolons before `.replace()` chains)
- **Site integrity** — HTML structure, required scripts, navigation chain, JS syntax in inline scripts
- **i18n unit tests** — core API behavior (`t()`, `applyText()`, `applyHtml()`, `applyDOM()`)
