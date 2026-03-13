# Contributing Translations

Thank you for helping translate OpenTelemetry Koans!

## How it works

All translatable text lives in JSON files under `site/i18n/`. Each file is one locale:

```
site/i18n/
├── en.json       ← English (reference)
└── pt-BR.json    ← Brazilian Portuguese
```

The `en.json` file is the source of truth. Each translation file has the same keys — you only change the values.

## Adding a new language

1. Copy `en.json` to a new file named with your locale code (e.g. `es.json`, `fr.json`, `ja.json`, `de.json`)
2. Translate all values. Do not change the keys.
3. Register the locale in `site/js/i18n.js` — add an entry to the `SUPPORTED` array:
   ```javascript
   { code: 'es', name: 'Español' }
   ```
4. Open a PR

## Translation rules

- **Translate values, not keys.** Keys like `"koan01.title"` stay exactly as they are.
- **Keep `\n`** for line breaks inside zen quotes and multi-line text. The i18n engine converts them to `<br>`.
- **Keep `{placeholder}` tokens** like `{count}`, `{kept}`, `{team}` — they get replaced with dynamic values at runtime.
- **Keep HTML tags** like `<strong>`, `<em>` in values that already have them.
- **Do not translate** technical terms that appear as code: service names (`gateway`, `api`), OTel attribute names (`http.route`, `service.name`), protocol names (`OTLP`), tool names (`Jaeger`, `Prometheus`).
- **Signal type names** (`Metric`, `Trace`, `Log`) should be translated when used as display labels but kept as-is when they appear in code examples.

## JSON structure

Keys are organized by page:

```json
{
  "common": { "shared strings across all pages" },
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
en = json.load(open('site/i18n/en.json'))
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
same = {k for k in e if k in t and e[k] == t[k]}
print(f'{len(missing)} missing, {len(same)} untranslated')
for k in sorted(missing): print(f'  MISSING: {k}')
"
```
