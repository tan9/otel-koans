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
});
