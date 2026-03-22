// @ts-check
var { test, expect } = require('@playwright/test');
var fs = require('fs');
var path = require('path');

var KOANS_DIR = path.join(__dirname, '..', '..', 'site', 'koans');
var koanFiles = fs.readdirSync(KOANS_DIR)
  .filter(function (f) { return f.endsWith('.html'); })
  .sort();

// All pages: index + each koan
var allPages = [{ name: 'index.html', path: '/' }].concat(
  koanFiles.map(function (f) {
    return { name: f, path: '/koans/' + f };
  })
);

var interactionPages = koanFiles.map(function (f) {
  return { name: f, path: '/koans/' + f };
});

// ── Helpers ──

/**
 * Collect console errors on a page. Returns an array that accumulates
 * error messages as they occur.
 */
// Errors from third-party scripts that are expected to fail in local dev
var IGNORED_PATTERNS = [
  'cloudflareinsights',
  'cdn-cgi/rum',
  'net::ERR_FAILED'
];

function isIgnored(text) {
  for (var i = 0; i < IGNORED_PATTERNS.length; i++) {
    if (text.indexOf(IGNORED_PATTERNS[i]) !== -1) return true;
  }
  return false;
}

function trackErrors(page) {
  var errors = [];
  page.on('console', function (msg) {
    if (msg.type() === 'error' && !isIgnored(msg.text())) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', function (err) {
    if (!isIgnored(err.message)) {
      errors.push(err.message);
    }
  });
  return errors;
}

/**
 * Wait for koan:idle — the page signals all setTimeout cascades
 * have settled. Falls back to a short timeout if idle never fires
 * (e.g., page has no timeouts at all).
 */
async function waitForIdle(page) {
  await page.evaluate(function () {
    return new Promise(function (resolve) {
      // If nothing is pending, resolve quickly (small grace period
      // in case a setTimeout is about to be scheduled)
      var pending = window.__koanIdlePending ? window.__koanIdlePending() : 0;
      if (pending === 0) {
        var orig = window.setTimeout;
        orig(resolve, 200);
        return;
      }
      // Otherwise wait for the idle event
      var timer = window.setTimeout(resolve, 10000); // safety fallback
      window.addEventListener('koan:idle', function () {
        clearTimeout(timer);
        resolve();
      }, { once: true });
    });
  });
}

/**
 * Wait for the i18n system to be ready.
 */
async function waitForI18n(page) {
  // Wait for i18n to load, then for the initial reveal cascade to settle
  await page.evaluate(function () {
    return new Promise(function (resolve) {
      if (window.i18n && typeof window.i18n.t === 'function') {
        // i18n already loaded — wait for idle
        var pending = window.__koanIdlePending ? window.__koanIdlePending() : 0;
        if (pending > 0) {
          window.addEventListener('koan:idle', function () { resolve(); }, { once: true });
        } else {
          // Give inline scripts time to schedule their initial timeouts
          var orig = window.setTimeout;
          orig(function () {
            var p2 = window.__koanIdlePending ? window.__koanIdlePending() : 0;
            if (p2 > 0) {
              window.addEventListener('koan:idle', function () { resolve(); }, { once: true });
            } else {
              resolve();
            }
          }, 300);
        }
      } else {
        window.addEventListener('i18n:ready', function () {
          var orig = window.setTimeout;
          orig(function () {
            var p = window.__koanIdlePending ? window.__koanIdlePending() : 0;
            if (p > 0) {
              window.addEventListener('koan:idle', function () { resolve(); }, { once: true });
            } else {
              resolve();
            }
          }, 300);
        }, { once: true });
      }
    });
  }).catch(function () { /* page may not have i18n */ });
}

// ══════════════════════════════════════════════════════════════════
//  Test 1: Page load — no console errors on any page
// ══════════════════════════════════════════════════════════════════

test.describe('Page load smoke test', function () {
  for (var i = 0; i < allPages.length; i++) {
    (function (pg) {
      test(pg.name + ' loads without console errors', async function ({ page }) {
        var errors = trackErrors(page);
        await page.goto(pg.path);
        await waitForI18n(page);
        expect(errors).toEqual([]);
      });
    })(allPages[i]);
  }
});

// ══════════════════════════════════════════════════════════════════
//  Test 2: Interaction smoke — click through each koan page
// ══════════════════════════════════════════════════════════════════

test.describe('Interaction smoke test', function () {
  test.setTimeout(120000);

  for (var i = 0; i < interactionPages.length; i++) {
    (function (pg) {
      test(pg.name + ' interactions produce no console errors', async function ({ page }) {
        var errors = trackErrors(page);

        await page.goto(pg.path);
        await waitForI18n(page);

        // Run up to 40 interaction rounds
        var maxRounds = 40;
        var clickedSet = new Set();

        for (var round = 0; round < maxRounds; round++) {
          // Bail on first error
          if (errors.length > 0) break;

          var didSomething = false;

          // Step 1: Fill any visible empty text inputs
          var inputs = await page.locator(
            'input[type="text"]:visible:not(:disabled):not([readonly])'
          ).all();
          for (var j = 0; j < inputs.length; j++) {
            var val = await inputs[j].inputValue();
            if (val === '') {
              await inputs[j].fill('test_value');
              didSomething = true;
            }
          }

          // Step 2: Find the first visible, enabled, un-clicked button
          var button = await findNextButton(page, clickedSet);
          if (!button) break;

          var id = await button.evaluate(function (el) {
            return el.id || el.getAttribute('data-i18n') ||
                   el.getAttribute('data-tool') ||
                   (el.getAttribute('data-answer') || '') + ':' +
                   el.textContent.trim().slice(0, 40) ||
                   el.className + ':' + el.textContent.trim().slice(0, 40);
          });

          if (clickedSet.has(id)) break;
          clickedSet.add(id);

          await button.click({ timeout: 2000 }).catch(function () {
            // Element may have become hidden during animation — skip
          });
          didSomething = true;

          // Wait for the page to settle after this interaction
          await waitForIdle(page);

          if (!didSomething) break;
        }

        expect(errors).toEqual([]);
      });
    })(interactionPages[i]);
  }
});

/**
 * Find the next button to click: visible, enabled, not yet clicked.
 * Prioritizes answer buttons, then action buttons.
 */
async function findNextButton(page, clickedSet) {
  // Priority 1: Clickable cards (koan 01 pattern)
  var cards = await page.locator(
    '.telem-card:visible:not(.investigated)'
  ).all();
  for (var i = 0; i < cards.length; i++) {
    var cardId = await cards[i].evaluate(function (el) {
      return 'card:' + (el.id || el.className);
    });
    if (!clickedSet.has(cardId)) return cards[i];
  }

  // Priority 2: Answer option buttons
  var answers = await page.locator(
    'button[data-answer]:visible:not(:disabled)'
  ).all();
  for (var i = 0; i < answers.length; i++) {
    var aId = await answers[i].evaluate(function (el) {
      return (el.getAttribute('data-i18n') || '') + ':' +
             el.textContent.trim().slice(0, 40);
    });
    if (!clickedSet.has(aId)) return answers[i];
  }

  // Priority 3: Action buttons (animate, check, set, run, etc.)
  var buttons = await page.locator(
    'button:visible:not(:disabled):not(.used)'
  ).all();
  for (var i = 0; i < buttons.length; i++) {
    var bId = await buttons[i].evaluate(function (el) {
      return el.id || el.getAttribute('data-i18n') ||
             el.getAttribute('data-tool') ||
             el.className + ':' + el.textContent.trim().slice(0, 40);
    });
    if (!clickedSet.has(bId)) return buttons[i];
  }

  return null;
}
