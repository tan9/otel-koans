/**
 * Site integrity tests — validate structural correctness of all pages.
 *
 * Checks: HTML structure, required assets, navigation chain, script
 * dependencies, KOAN_ORDER consistency, and continue-link progression.
 */
var fs = require('fs');
var path = require('path');

var SITE_DIR = path.join(__dirname, '..', 'site');
var KOANS_DIR = path.join(SITE_DIR, 'koans');

var koanFiles = fs.readdirSync(KOANS_DIR)
  .filter(function (f) { return f.endsWith('.html'); })
  .sort();

var koans = koanFiles.map(function (f) {
  return { name: f, content: fs.readFileSync(path.join(KOANS_DIR, f), 'utf8') };
});

/* ── Extract KOAN_ORDER from progress.js ── */
var progressSrc = fs.readFileSync(path.join(SITE_DIR, 'js', 'progress.js'), 'utf8');
var orderMatch = progressSrc.match(/var KOAN_ORDER\s*=\s*\[([\s\S]*?)\];/);
var koanOrderFiles = [];
if (orderMatch) {
  var fileMatches = orderMatch[1].match(/file:\s*'([^']+)'/g);
  if (fileMatches) {
    koanOrderFiles = fileMatches.map(function (m) {
      return m.replace(/file:\s*'/, '').replace(/'$/, '');
    });
  }
}

/* ══════════════════════════════════════════════════════════════════
   HTML structure
   ══════════════════════════════════════════════════════════════════ */

describe('HTML structure', function () {
  test.each(koans)('$name has DOCTYPE', function (koan) {
    expect(koan.content).toMatch(/^<!DOCTYPE html>/i);
  });

  test.each(koans)('$name has lang attribute on html element', function (koan) {
    expect(koan.content).toMatch(/<html\s[^>]*lang="/);
  });

  test.each(koans)('$name has charset meta', function (koan) {
    expect(koan.content).toMatch(/<meta\s+charset="UTF-8"/i);
  });

  test.each(koans)('$name has viewport meta', function (koan) {
    expect(koan.content).toMatch(/<meta\s+name="viewport"/);
  });

  test.each(koans)('$name has translated page title', function (koan) {
    expect(koan.content).toMatch(/<title\s+data-i18n="/);
  });

  test.each(koans)('$name has koan-title heading', function (koan) {
    expect(koan.content).toMatch(/class="koan-title"/);
  });

  test.each(koans)('$name has progress bar', function (koan) {
    expect(koan.content).toMatch(/class="koan-progress"/);
  });

  test.each(koans)('$name has mobile gate', function (koan) {
    expect(koan.content).toMatch(/class="mobile-gate"/);
  });

  test.each(koans)('$name closes body and html tags', function (koan) {
    expect(koan.content).toMatch(/<\/body>\s*<\/html>\s*$/);
  });
});

/* ══════════════════════════════════════════════════════════════════
   Required asset references
   ══════════════════════════════════════════════════════════════════ */

describe('Asset references', function () {
  test.each(koans)('$name links shared.css', function (koan) {
    expect(koan.content).toMatch(/href="\.\.\/css\/shared\.css"/);
  });

  test.each(koans)('$name loads i18n.js in head', function (koan) {
    // i18n.js must appear before </head>
    var headContent = koan.content.split('</head>')[0];
    expect(headContent).toMatch(/src="\.\.\/js\/i18n\.js"/);
  });

  test.each(koans)('$name loads scroll.js', function (koan) {
    expect(koan.content).toMatch(/src="\.\.\/js\/scroll\.js"/);
  });

  test.each(koans)('$name loads music.js', function (koan) {
    expect(koan.content).toMatch(/src="\.\.\/js\/music\.js"/);
  });

  test.each(koans)('$name loads certificate.js', function (koan) {
    expect(koan.content).toMatch(/src="\.\.\/js\/certificate\.js"/);
  });

  test.each(koans)('$name loads progress.js', function (koan) {
    expect(koan.content).toMatch(/src="\.\.\/js\/progress\.js"/);
  });

  // Verify all referenced JS/CSS files actually exist on disk
  test('all referenced assets exist', function () {
    var requiredFiles = [
      'css/shared.css',
      'js/i18n.js',
      'js/scroll.js',
      'js/music.js',
      'js/certificate.js',
      'js/progress.js',
      'favicon.ico',
      'img/favicon-32x32.png',
      'img/favicon-16x16.png',
      'img/apple-touch-icon.png',
      'audio/bg-music.mp3'
    ];
    var missing = requiredFiles.filter(function (f) {
      return !fs.existsSync(path.join(SITE_DIR, f));
    });
    expect(missing).toEqual([]);
  });
});

/* ══════════════════════════════════════════════════════════════════
   JavaScript syntax — catch broken <script> blocks
   ══════════════════════════════════════════════════════════════════ */

describe('JavaScript syntax in shared files', function () {
  var jsFiles = ['i18n.js', 'progress.js', 'scroll.js', 'music.js', 'certificate.js'];

  test.each(jsFiles)('%s parses without syntax errors', function (file) {
    var code = fs.readFileSync(path.join(SITE_DIR, 'js', file), 'utf8');
    expect(function () { new Function(code); }).not.toThrow();
  });
});

describe('JavaScript syntax in koan inline scripts', function () {
  test.each(koans)('$name inline scripts parse without syntax errors', function (koan) {
    // Extract all inline <script> blocks (not src= ones)
    var scriptPattern = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
    var match;
    var errors = [];
    while ((match = scriptPattern.exec(koan.content)) !== null) {
      var code = match[1].trim();
      if (!code) continue;
      try {
        new Function(code);
      } catch (e) {
        errors.push(e.message + ' in script starting with: ' + code.slice(0, 60));
      }
    }
    expect(errors).toEqual([]);
  });
});

/* ══════════════════════════════════════════════════════════════════
   KOAN_ORDER ↔ filesystem consistency
   ══════════════════════════════════════════════════════════════════ */

describe('KOAN_ORDER consistency', function () {
  test('KOAN_ORDER was parsed from progress.js', function () {
    expect(koanOrderFiles.length).toBeGreaterThan(0);
  });

  test('every koan file on disk is listed in KOAN_ORDER', function () {
    var orderKoanFiles = koanOrderFiles
      .filter(function (f) { return f.startsWith('koans/'); })
      .map(function (f) { return f.replace('koans/', ''); });
    var onDiskOnly = koanFiles.filter(function (f) {
      return orderKoanFiles.indexOf(f) === -1;
    });
    expect(onDiskOnly).toEqual([]);
  });

  test('every koan in KOAN_ORDER exists on disk', function () {
    var missing = koanOrderFiles.filter(function (f) {
      return !fs.existsSync(path.join(SITE_DIR, f));
    });
    expect(missing).toEqual([]);
  });

  test('KOAN_ORDER numbers are sequential starting from 0', function () {
    var numbers = progressSrc.match(/n:\s*(\d+)/g).map(function (m) {
      return parseInt(m.replace('n:', '').trim());
    });
    for (var i = 0; i < numbers.length; i++) {
      expect(numbers[i]).toBe(i);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════
   Navigation chain — continue links follow KOAN_ORDER
   ══════════════════════════════════════════════════════════════════ */

describe('Navigation chain', function () {
  // Build expected chain from KOAN_ORDER (skip index.html at position 0)
  var koanOnlyOrder = koanOrderFiles.filter(function (f) {
    return f.startsWith('koans/');
  }).map(function (f) {
    return f.replace('koans/', '');
  });

  // Each koan (except the last) should have a continue link to the next koan
  var chainCases = koanOnlyOrder.slice(0, -1).map(function (file, idx) {
    return { from: file, expectedNext: koanOnlyOrder[idx + 1] };
  });

  test.each(chainCases)(
    '$from has a link to $expectedNext',
    function (c) {
      var koan = koans.find(function (k) { return k.name === c.from; });
      if (!koan) return; // missing-file test covers this
      // Check for any <a> linking to the expected next koan
      var hasLink = koan.content.indexOf('href="' + c.expectedNext + '"') !== -1;
      expect(hasLink).toBe(true);
    }
  );
});

/* ══════════════════════════════════════════════════════════════════
   data-i18n attribute validity
   ══════════════════════════════════════════════════════════════════ */

describe('data-i18n attribute format', function () {
  test.each(koans)('$name has no empty data-i18n attributes', function (koan) {
    var emptyAttrs = koan.content.match(/data-i18n(?:-html|-title|-aria|-placeholder)?=""/g);
    expect(emptyAttrs).toBeNull();
  });

  test.each(koans)('$name data-i18n values look like valid dot-paths', function (koan) {
    var attrPattern = /data-i18n(?:-html|-title|-aria|-placeholder)?="([^"]+)"/g;
    var match;
    var invalid = [];
    while ((match = attrPattern.exec(koan.content)) !== null) {
      // Valid keys look like "section.keyName" (at least one dot)
      if (!/^[a-zA-Z]\w*\.[a-zA-Z]\w*$/.test(match[1])) {
        invalid.push(match[1]);
      }
    }
    expect(invalid).toEqual([]);
  });
});
