# Ruby Koans: Structure and Design Research

Source: [github.com/edgecase/ruby_koans](https://github.com/edgecase/ruby_koans), [rubykoans.com](https://www.rubykoans.com/)

## File Organization

- Every koan file: `about_<topic>.rb`
- Each file is a class inheriting from `Neo::Koan`
- Each class contains `test_` methods (the individual exercises)
- Two-layer system: `src/` has answer keys, `koans/` has student-facing files with blanks
- `rake gen` transforms answer keys into student files by stripping solutions via regex

## Placeholder System

Three placeholder types that students fill in:

| Placeholder | What it returns | Purpose |
|---|---|---|
| `__` | `"FILL ME IN"` | General value — student replaces with correct value |
| `_n_` | `999999` | Numeric — deliberately wrong number |
| `___` | `FillMeInError` | Exception class — student provides correct exception |

Hidden code blocks use `#--` / `#++` markers — lines between them are stripped from student files.

## Assertion Pattern

Custom lightweight assertions (not Minitest/Test::Unit):

- `assert(condition)` — truthiness
- `assert_equal(expected, actual)` — primary workhorse
- `assert_not_equal(expected, actual)`
- `assert_nil(value)`
- `assert_raise(ExceptionClass) { block }` — exception verification
- `assert_match(pattern, string)` — regex

All raise `FailedAssertionError` on failure.

## Progression (The Path)

`path_to_enlightenment.rb` defines exact ordering via sequential `require` statements. ~280 tests across ~33 files:

1. `about_asserts` — testing fundamentals
2. `about_nil`
3. `about_objects`
4. `about_arrays` / `about_array_assignment`
5. `about_hashes`
6. `about_strings`
7. `about_symbols`
8. `about_regular_expressions`
9. `about_methods` / `about_keyword_arguments`
10. `about_constants`
11. `about_control_statements`
12. `about_true_and_false`
13. `about_triangle_project` — first applied project
14. `about_exceptions`
15. `about_triangle_project_2`
16. `about_iteration` / `about_blocks` / `about_sandwich_code`
17. `about_scoring_project` — applied project
18. `about_classes` / `about_open_classes`
19. `about_dice_project` — applied project
20. `about_inheritance` / `about_modules` / `about_scope`
21. `about_class_methods` / `about_message_passing`
22. `about_proxy_object_project` — capstone
23. `about_to_str`
24. `about_extra_credit` — optional

Pattern: primitives → control flow → OOP → metaprogramming, with applied projects interspersed.

## Runner Mechanism

Three components in `neo.rb`:

**Koan** — base class. Discovers test methods via `method_added()`. `meditate()` runs each test: setup → execute → teardown → capture exceptions.

**Sensei** — observer/reporter. Wraps each test via `catch(:neo_exit)`. On failure:
- Records failure, displays test name and error location
- Shows "You have not yet reached enlightenment"
- Shows the assertion failure and source location
- Displays progress bar: `[X________] 1/280 (0%)`
- Appends a zen-themed motivational quote
- Persists progress to `.path_progress`

**ThePath** — orchestrator. Iterates through all `Koan` subclasses in load order, halts at first failure.

Entry point: `END` block in `neo.rb` triggers on interpreter exit. Students run `rake` or `ruby path_to_enlightenment.rb`.

## Example Output

```
AboutAsserts#test_assert_truth has damaged your karma.

The Master says:
  You have not yet reached enlightenment.

The answers you seek...
  <false> is not true.

Please meditate on the following code:
  ./about_asserts.rb:10:in `test_assert_truth'

mountains are merely mountains
your path thus far [X_________________________________________________] 0/280
```

## Key Design Principles

1. **Stop-on-first-failure** — exactly one problem at a time, tight feedback loop
2. **Red-Green-Reflect** — see failure, fix it, reflect on what the test taught
3. **Incremental complexity** — within files and across files
4. **Self-contained discovery** — learn by observing actual behavior, not reading docs
5. **Mixed exercise types** — fill-in-the-blank (comprehension) + write-code (application) + projects (synthesis)
6. **Motivational scaffolding** — themed language, progress bars, encouraging messages
7. **Minimal tooling** — just a terminal and text editor
8. **Answer key available** — `src/` directory for when students get stuck
