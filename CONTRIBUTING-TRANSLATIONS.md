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
# Serve the site
python3 -m http.server 8000 --directory site

# Open http://localhost:8000
# Click the language icon (文A) in the bottom bar to switch languages
```

## Checking for missing keys

```bash
python3 -c "
import json
en = json.load(open('site/i18n/en-US.json'))
tr = json.load(open('site/i18n/YOUR_LOCALE.json'))

def flat(d, p=''):
    out = {}
    for k,v in d.items():
        key = p+'.'+k if p else k
        if isinstance(v,dict): out.update(flat(v,key))
        else: out[key]=v
    return out

e, t = flat(en), flat(tr)
missing = set(e) - set(t)
extra = set(t) - set(e)
same = {k for k in e if k in t and e[k] == t[k] and len(e[k]) > 10}
print(f'{len(missing)} missing, {len(extra)} extra, {len(same)} possibly untranslated')
for k in sorted(missing): print(f'  MISSING: {k}')
for k in sorted(extra): print(f'  EXTRA: {k}')
"
```

## Checking for HTML/placeholder consistency

```bash
python3 -c "
import json, re
en = json.load(open('site/i18n/en-US.json'))
tr = json.load(open('site/i18n/YOUR_LOCALE.json'))

def flat(d, p=''):
    out = {}
    for k,v in d.items():
        key = p+'.'+k if p else k
        if isinstance(v,dict): out.update(flat(v,key))
        else: out[key]=v
    return out

e, t = flat(en), flat(tr)
for k in sorted(e):
    if k not in t: continue
    ev, tv = e[k], t[k]
    if not isinstance(ev, str): continue
    # Check template variables
    evars = set(re.findall(r'\{[^}]+\}', ev))
    tvars = set(re.findall(r'\{[^}]+\}', tv))
    if evars != tvars: print(f'  VAR mismatch: {k}')
    # Check HTML tags
    etags = sorted(re.findall(r'<[^>]+>', ev))
    ttags = sorted(re.findall(r'<[^>]+>', tv))
    if etags != ttags: print(f'  TAG mismatch: {k}')
    # Check newlines
    if ev.count(chr(10)) != tv.count(chr(10)): print(f'  NEWLINE mismatch: {k}')
"
```
