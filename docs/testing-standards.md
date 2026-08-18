# Testing Standards

## Testing framework

The repository implements tests using Python's built-in `unittest` framework (`import unittest`, e.g. `emerge/tests/parsers/test_py_parser.py:9`). Test classes subclass `unittest.TestCase` and follow the `setUp`/`tearDown` lifecycle (`emerge/tests/parsers/test_py_parser.py:21-29`).

`run_tests.py` is the repository's test runner: it uses `unittest.TestLoader().discover('emerge')` to find all tests under the `emerge` package and runs them with `unittest.TextTestRunner(verbosity=2)`. After the test run, it additionally computes and prints docstring coverage using the `interrogate` package (`cov = coverage.InterrogateCoverage(paths=["."])`), reporting `covered/total` as a percentage — this is a documentation-coverage check, not a test-pass/fail gate. `CONTRIBUTING.md:22` states this coverage was "about 25% for the first public release" for this repository at that point in time.

Not found in codebase: pytest, nose, or any other third-party test runner/framework; no test configuration file (e.g. `pytest.ini`, `tox.ini`) exists.

## Test organization

Tests live under `emerge/tests/`, mirroring the package structure being tested, each subpackage with its own `__init__.py`:

- `emerge/tests/config/test_config.py` — tests for `Configuration` (`emerge/config.py`).
- `emerge/tests/metrics/test_number_of_methods.py`, `test_tfidf.py` — tests for individual metric implementations.
- `emerge/tests/parsers/test_<language>_parser.py` — one module per language parser (`test_c_parser.py`, `test_cpp_parser.py`, `test_go_parser.py`, `test_groovy_parser.py`, `test_java_parser.py`, `test_javascript_parser.py`, `test_kotlin_parser.py`, `test_objc_parser.py`, `test_py_parser.py`, `test_ruby_parser.py`, `test_swift_parser.py`, `test_typescript_parser.py`), plus `test_parsing_mixin.py` for the shared `ParsingMixin` base behavior.
- `emerge/tests/testdata/<language>.py` — literal source-code fixture modules, one per tested language (`c.py`, `cpp.py`, `go.py`, `groovy.py`, `java.py`, `javascript.py`, `kotlin.py`, `objc.py`, `py.py`, `ruby.py`, `swift.py`, `typescript.py`), each exporting a dict of `{file_name: file_content}` pairs (e.g. `PYTHON_TEST_FILES` imported at `emerge/tests/parsers/test_py_parser.py:11`).

Parser test coverage was not found for every language parser module in `emerge/languages/` (e.g. no `test_csharp_parser.py`, `test_vbnet_parser.py`, `test_php_parser.py`, `test_css_parser.py`, `test_scss_parser.py`, `test_json_parser.py`, or `test_twig_parser.py` was found under `emerge/tests/parsers/`) — absence noted here as "not found in inspected repository areas," not as a confirmed gap across the entire codebase.

## Test pattern (observed in `test_py_parser.py`)

The repository's parser tests follow a consistent shape, illustrated by `PythonParserTestCase` (`emerge/tests/parsers/test_py_parser.py:19-51`):

1. `setUp` constructs a fresh parser instance, an `Analysis()` instance with a fixed `analysis_name`/`source_directory`, and loads the relevant fixture dict from `tests.testdata.<language>`.
2. The test asserts the parser has no results before scanning (`self.assertFalse(self.parser.results)`).
3. It calls `parser.generate_file_result_from_analysis(...)` for each fixture file, using the fixture dict's key as both `file_name` and to build `full_file_path`.
4. It asserts on `parser.results`: non-empty, an expected count, and per-result invariants (`scanned_tokens` non-empty, `scanned_import_dependencies` non-empty, `analysis.analysis_name` set, `scanned_file_name` set, `scanned_by` set, `scanned_language` equals the expected `LanguageType` member).

## Fixtures and mocks

Fixtures are plain Python data (source-code strings keyed by filename) under `emerge/tests/testdata/`, imported directly into test modules (e.g. `from tests.testdata.py import PYTHON_TEST_FILES`). No mocking library (e.g. `unittest.mock`, `pytest-mock`) usage was found in the inspected test files — tests construct real `Analysis` and parser instances rather than mocking collaborators.

## Naming conventions

- Test files: `test_<subject>.py` (e.g. `test_py_parser.py`, `test_number_of_methods.py`, `test_config.py`).
- Test classes: `<Subject>TestCase` (e.g. `PythonParserTestCase`).
- Test methods: `test_<behavior>` with a short docstring describing the behavior under test (e.g. `test_generate_file_results`, `"""Generate file results and check basic attributes."""`).

## Running tests

Evidence from `.vscode/tasks.json`: the "run tests" task invokes `venv/bin/python run_tests.py`, implying a project-local virtual environment at `venv/` is the expected local dev setup, though this is IDE tooling configuration rather than a documented requirement enforced by the repository.
