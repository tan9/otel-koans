/**
 * Static analysis tests — catch broken i18n call patterns in koan HTML files.
 *
 * These tests scan JavaScript inside koan files for patterns that indicate
 * a botched migration (e.g., applyText() return value chained with .replace
 * or string concatenation after a semicolon).
 */
var fs = require('fs');
var path = require('path');

var KOANS_DIR = path.join(__dirname, '..', 'site', 'koans');

var koanFiles = fs.readdirSync(KOANS_DIR)
  .filter(function (f) { return f.endsWith('.html'); })
  .map(function (f) { return { name: f, content: fs.readFileSync(path.join(KOANS_DIR, f), 'utf8') }; });

describe('Static analysis: broken i18n call patterns', function () {

  // The exact bug from PR #9: applyText/applyHtml followed by semicolon then .replace()
  test.each(koanFiles)('$name: no applyText/applyHtml semicolon-then-chain', function (file) {
    // Match: applyText(...); followed by .replace( or + something
    var brokenChain = /i18n\.apply(?:Text|Html)\([^)]*\)\s*;\s*\.\s*replace\s*\(/g;
    var matches = file.content.match(brokenChain);
    expect(matches).toBeNull();
  });

  test.each(koanFiles)('$name: no applyText/applyHtml semicolon-then-concatenation', function (file) {
    // Match: applyText(...); + variable
    var brokenConcat = /i18n\.apply(?:Text|Html)\([^)]*\)\s*;\s*\+\s*\w/g;
    var matches = file.content.match(brokenConcat);
    expect(matches).toBeNull();
  });

  // Bare i18n.t() assigned to textContent/innerHTML won't survive locale switch
  test.each(koanFiles)('$name: no direct i18n.t() assignment to textContent', function (file) {
    // Match: .textContent = i18n.t(...)
    var directAssign = /\.textContent\s*=\s*i18n\.t\s*\(/g;
    var matches = file.content.match(directAssign);
    expect(matches).toBeNull();
  });

  test.each(koanFiles)('$name: no direct i18n.t() assignment to innerHTML', function (file) {
    // Match: .innerHTML = i18n.t(...)
    var directAssign = /\.innerHTML\s*=\s*i18n\.t\s*\(/g;
    var matches = file.content.match(directAssign);
    expect(matches).toBeNull();
  });

  // i18n.t() in koan inline scripts produces a one-time translation that goes
  // stale on locale switch. Use applyText/applyHtml instead, or store the key
  // and translate at display time. The only allowed use is the ready-check:
  //   i18n.t('common.desktopOnly') !== 'common.desktopOnly'
  test.each(koanFiles)('$name: no i18n.t() in inline scripts (use applyText/applyHtml instead)', function (file) {
    // Extract inline <script> blocks (not src= ones)
    var scriptPattern = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
    var match;
    var calls = [];
    while ((match = scriptPattern.exec(file.content)) !== null) {
      var code = match[1];
      // Find all i18n.t( calls with their surrounding context
      var tCallPattern = /i18n\.t\s*\(/g;
      var tMatch;
      while ((tMatch = tCallPattern.exec(code)) !== null) {
        // Get the line containing this call
        var start = code.lastIndexOf('\n', tMatch.index) + 1;
        var end = code.indexOf('\n', tMatch.index);
        if (end === -1) end = code.length;
        var line = code.slice(start, end).trim();

        // Skip the ready-check pattern: i18n.t('...') !== '...'
        if (/i18n\.t\s*\(\s*['"][^'"]+['"]\s*\)\s*!==?\s*['"]/.test(line)) continue;

        calls.push(line.slice(0, 100));
      }
    }
    expect(calls).toEqual([]);
  });
});
