/**
 * Locale consistency tests — ensure all locale files stay in sync.
 *
 * Checks: key parity, placeholder preservation, orphan detection,
 * and that all i18n keys referenced in HTML/JS actually exist.
 */
var fs = require('fs');
var path = require('path');

var I18N_DIR = path.join(__dirname, '..', 'site', 'i18n');
var SITE_DIR = path.join(__dirname, '..', 'site');

/* ── Load all locale files ── */
var localeFiles = fs.readdirSync(I18N_DIR)
  .filter(function (f) { return f.endsWith('.json'); })
  .sort();

var locales = {};
localeFiles.forEach(function (f) {
  var code = f.replace('.json', '');
  locales[code] = JSON.parse(fs.readFileSync(path.join(I18N_DIR, f), 'utf8'));
});

var enUS = locales['en-US'];

/* ── Flatten nested object to dot-path keys ── */
function flattenKeys(obj, prefix) {
  prefix = prefix || '';
  var keys = [];
  Object.keys(obj).forEach(function (k) {
    var fullKey = prefix ? prefix + '.' + k : k;
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      keys = keys.concat(flattenKeys(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  });
  return keys;
}

var enKeys = flattenKeys(enUS);

/* ── Extract {placeholder} tokens from a string ── */
function extractPlaceholders(str) {
  var matches = str.match(/\{[a-zA-Z_]\w*\}/g);
  return matches ? matches.sort() : [];
}

/* ── Dot-path lookup ── */
function lookup(obj, dotPath) {
  var parts = dotPath.split('.');
  var cur = obj;
  for (var i = 0; i < parts.length; i++) {
    if (cur && typeof cur === 'object' && parts[i] in cur) {
      cur = cur[parts[i]];
    } else {
      return undefined;
    }
  }
  return cur;
}

/* ── Collect all HTML and JS files under site/ ── */
function collectFiles(dir, ext) {
  var results = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    var full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'i18n' && entry.name !== 'img' && entry.name !== 'audio') {
      results = results.concat(collectFiles(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full);
    }
  });
  return results;
}

var htmlFiles = collectFiles(SITE_DIR, '.html');
var jsFiles = collectFiles(SITE_DIR, '.js');
var allSourceContent = htmlFiles.concat(jsFiles).map(function (f) {
  return fs.readFileSync(f, 'utf8');
}).join('\n');

/* ══════════════════════════════════════════════════════════════════
   Tests
   ══════════════════════════════════════════════════════════════════ */

describe('Locale consistency: key parity', function () {
  var otherLocales = Object.keys(locales).filter(function (c) { return c !== 'en-US'; });

  test.each(otherLocales)('%s has all en-US keys', function (code) {
    var missing = enKeys.filter(function (k) {
      return lookup(locales[code], k) === undefined;
    });
    expect(missing).toEqual([]);
  });

  test.each(otherLocales)('%s has no extra keys beyond en-US', function (code) {
    var otherKeys = flattenKeys(locales[code]);
    var extra = otherKeys.filter(function (k) {
      return lookup(enUS, k) === undefined;
    });
    expect(extra).toEqual([]);
  });
});

describe('Locale consistency: placeholder preservation', function () {
  var keysWithPlaceholders = enKeys.filter(function (k) {
    var v = lookup(enUS, k);
    return typeof v === 'string' && /\{[a-zA-Z_]\w*\}/.test(v);
  });

  var otherLocales = Object.keys(locales).filter(function (c) { return c !== 'en-US'; });

  // Build test cases: each [locale, key] pair
  var cases = [];
  otherLocales.forEach(function (code) {
    keysWithPlaceholders.forEach(function (key) {
      cases.push([code, key]);
    });
  });

  test.each(cases)('%s: key "%s" preserves placeholders', function (code, key) {
    var enValue = lookup(enUS, key);
    var locValue = lookup(locales[code], key);
    if (locValue === undefined) return; // missing-key test covers this

    var enPH = extractPlaceholders(enValue);
    var locPH = extractPlaceholders(locValue);
    expect(locPH).toEqual(enPH);
  });
});

describe('Locale consistency: referenced keys exist in en-US', function () {
  // Extract keys from data-i18n, data-i18n-html, data-i18n-title, etc.
  var attrPattern = /data-i18n(?:-html|-title|-aria|-placeholder)?="([^"]+)"/g;
  var attrKeys = [];
  var match;
  while ((match = attrPattern.exec(allSourceContent)) !== null) {
    attrKeys.push(match[1]);
  }

  // Extract keys from i18n.t('...'), applyText(el, '...'), applyHtml(el, '...')
  // Skip keys that are concatenated with variables (e.g., 'key' + suffix) — those
  // are dynamic base strings, not complete keys.
  var jsPattern = /i18n\.(?:t|applyText|applyHtml)\s*\(\s*(?:\w+\s*,\s*)?['"]([^'"]+)['"]\s*(\+|\))/g;
  var jsKeys = [];
  while ((match = jsPattern.exec(allSourceContent)) !== null) {
    if (match[2] === '+') continue; // dynamic key construction — skip
    jsKeys.push(match[1]);
  }

  var allReferencedKeys = Array.from(new Set(attrKeys.concat(jsKeys))).sort();

  test('all referenced i18n keys exist in en-US.json', function () {
    var missing = allReferencedKeys.filter(function (k) {
      return lookup(enUS, k) === undefined;
    });
    expect(missing).toEqual([]);
  });
});
