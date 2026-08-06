# Testing Standards

## Testing Framework (Level 1)

The repository uses the Python standard-library `unittest` framework exclusively. Every test file observed imports `unittest` and subclasses `unittest.TestCase` (e.g. `emerge/tests/parsers/test_java_parser.py:9,19`, `emerge/tests/config/test_config.py:8,19`, `emerge/tests/metrics/test_number_of_methods.py:8,49`). Not found in codebase: any use of `pytest`, `nose`, or a third-party assertion/mocking library.

Test discovery and execution is driven by `run_tests.py`, which uses `unittest.TestLoader().discover('emerge')` and `unittest.TextTestRunner(verbosity=2)` (`run_tests.py:12-17`), then separately measures docstring coverage with the `interrogate` package over the whole repository (`run_tests.py:19-22`).

## Test Organization (Level 1 — directory evidence)

```
emerge/tests/
├── config/    test_config.py                         — Configuration/YamlLoader behavior
├── metrics/   test_number_of_methods.py, test_tfidf.py — metric calculation across all parsers
├── parsers/   test_<language>_parser.py (one per language) + test_parsing_mixin.py
└── testdata/  <language>.py — literal, embedded source-code fixtures keyed by filename
```

One test module exists per parser class for: C (`test_c_parser.py`), C++, Go, Groovy, Java, JavaScript, Kotlin, ObjC, Python, Ruby, Swift, TypeScript. Not found in codebase: dedicated test modules for `CSharpParser`, `VBNetParser`, `PHPParser`, `CSSParser`, `JSONParser`, `SCSSParser`, or `TwigParser` within the inspected `emerge/tests/parsers/` directory listing.

Per `codegraph_explore` blast-radius data, `Parser` (the enum, `abstractparser.py:48`) itself has no covering tests found, though the concrete parser classes that implement `AbstractParser` do have dedicated test modules as listed above.

## Test Naming Conventions (Level 1)

- Test files: `test_<subject>.py`, matching `unittest`'s default discovery pattern.
- Test case classes: `<Subject>TestCase` (e.g. `JavaParserTestCase` in `test_java_parser.py:19`, `ConfigurationTestCase` in `test_config.py:19`, `ParsingMixinTestCase` in `test_parsing_mixin.py:15`, `NumberOfMethodsTestCase` in `test_number_of_methods.py:49`).
- Test methods: `test_<behavior_described_in_snake_case>` (e.g. `test_generate_file_results`, `test_generate_entity_results` in `test_java_parser.py:31,52`; `test_config_init` in `test_config.py:29`).
- Every observed `TestCase` subclass defines both `setUp` and `tearDown`, even when `tearDown` is a no-op (`pass`) (`test_java_parser.py:21,28`; `test_config.py:21,26`; `test_parsing_mixin.py:17,23`).

## Fixtures (Level 1)

Language-specific source-code fixtures live in `emerge/tests/testdata/<language>.py` as module-level dictionaries named `<LANGUAGE>_TEST_FILES` mapping a filename string to its full literal source content (e.g. `JAVA_TEST_FILES` in `testdata/java.py:3`). Some fixtures are explicitly sourced from real open-source projects, documented inline as a comment (`testdata/java.py:1`: "Borrowed for testing with real test data from https://github.com/facebook/fresco"). Per the repository's own scope rules, this fixture-borrowed code demonstrates parser capability against real-world source; it is not evidence of production behavior against those specific upstream projects.

## Assertion Style (Level 1)

Tests use plain `unittest` assertions almost exclusively as `self.assertTrue(<boolean expression>)`, including for equality checks (e.g. `self.assertTrue(relative_analysis_path == expected_relative_analysis_path)` in `test_parsing_mixin.py:32`, `self.assertTrue(len(results) == 2)` in `test_java_parser.py:40,61`) rather than `self.assertEqual`. `self.assertFalse` and `self.assertIsNotNone`/`self.assertIs` are also used (`test_java_parser.py:33`; `test_config.py:30-35`).

## Mocking (Level 1)

Not found in codebase: use of `unittest.mock`, `MagicMock`, or any mocking framework in the inspected test files. Tests construct real `Analysis`, parser, and metric instances directly and run them against embedded fixture source strings rather than mocked collaborators (e.g. `test_number_of_methods.py:40-41` constructs a real `Analyzer`).

## Utilities

Test-local logging is configured ad hoc per test module using `coloredlogs.install(level='INFO', logger=LOGGER, fmt=...)` against a module-level `logging.getLogger('TESTS')` logger (`test_config.py:11-15`, `test_number_of_methods.py:10-11,45-46`) — this is a per-file pattern, not a shared test utility module. Not found in codebase: a shared `conftest.py`, custom test base class, or shared assertion helper module.

## Docstring Coverage

`run_tests.py:19-22` computes docstring coverage across the whole repository using `interrogate.coverage.InterrogateCoverage` and prints the resulting percentage. `CONTRIBUTING.md:22` states this was "about 25% for the first public release" — this is a project-stated historical figure, not independently re-verified during this analysis.
