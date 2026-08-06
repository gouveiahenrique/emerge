# Repository Structure

## Top-Level Layout (Level 1 — directory/file presence)

```
/
├── emerge.py            # thin CLI shim, delegates to emerge.main.run()
├── setup.py             # packaging metadata, console_scripts entry point
├── requirements.txt     # pinned/declared runtime + tooling dependencies
├── run_tests.py         # unittest discovery + interrogate docstring coverage runner
├── Dockerfile           # ubuntu:22.04-based container image
├── MANIFEST.in          # sdist packaging include/exclude rules
├── README.md            # user-facing install/usage/config documentation
├── CONTRIBUTING.md      # code style / tooling notes for contributors
├── CREDITS.md           # third-party attributions
├── .pylintrc, .flake8   # lint configuration
├── dist/                # build output directory (not source)
├── .github/             # issue templates only (ISSUE_TEMPLATE/*)
├── .vscode/             # editor configuration
└── emerge/              # the Python package (see below)
```

## `emerge/` Package Structure

```
emerge/
├── __init__.py
├── main.py              # run() — the console_scripts entry point target
├── appear.py            # Emerge class — top-level orchestration, parser registry
├── config.py            # Configuration, YamlLoader, ConfigKey* enums
├── analyzer.py          # Analyzer — per-analysis scan/metric/export pipeline driver
├── analysis.py          # Analysis — per-analysis state, export() implementation
├── graph.py             # GraphRepresentation, GraphType, FileSystemNode
├── export.py            # GraphExporter, TableExporter, JSONExporter, D3Exporter
├── files.py             # FileScanMapper, LanguageExtension, FileManager
├── results.py           # FileResult, EntityResult (concrete result classes)
├── abstractresult.py    # AbstractResult, AbstractFileResult, AbstractEntityResult
├── stats.py             # Statistics (referenced across analysis.py, analyzer.py)
├── core.py              # format_timedelta and other small utilities
├── log.py               # Logger wrapper, LogLevel, LogState
├── configs/             # bundled YAML config templates + defaults
├── languages/           # one parser module per supported language
├── metrics/             # one metric implementation per subpackage
├── output/html/         # D3/Bootstrap web-app template copied into export dirs
└── tests/               # unittest-based test suite
```

## `emerge/languages/` — Parser Modules

Each file implements one concrete subclass of `AbstractParser` (defined in `abstractparser.py`), registered by name via `parser_name()`. Files observed: `abstractparser.py`, `cparser.py`, `cppparser.py`, `csharpparser.py`, `cssparser.py`, `goparser.py`, `groovyparser.py`, `javaparser.py`, `javascriptparser.py`, `jsonparser.py`, `kotlinparser.py`, `objcparser.py`, `phpparser.py`, `pyparser.py`, `rubyparser.py`, `scssparser.py`, `swiftparser.py`, `twigparser.py`, `typescriptparser.py`, `vbnetparser.py`. All 19 are instantiated and registered in `emerge/appear.py:54-74`.

Responsibility boundary: each parser converts raw file content into `FileResult`/`EntityResult` objects with resolved import/inheritance dependencies. Parsers depend on `emerge/abstractresult.py` and `emerge/results.py` for result types, and on `ParsingMixin` (in `abstractparser.py`) for shared tokenization helpers. Per `codegraph_explore` blast-radius data, the `Parser` enum (`abstractparser.py:48`) has 19 known callers across these parser modules but no covering tests were found for the enum itself (individual parser behavior is tested — see `docs/testing-standards.md`).

## `emerge/metrics/` — Metric Subpackages

```
metrics/
├── abstractmetric.py    # AbstractMetric, AbstractCodeMetric, AbstractGraphMetric, MetricKeys
├── metrics.py           # (present; not read in full during this analysis)
├── faninout/faninout.py       # FanInOutMetric — graph-based metric
├── modularity/modularity.py   # LouvainModularityMetric — graph-based metric
├── numberofmethods/numberofmethods.py  # NumberOfMethodsMetric — code metric
├── sloc/sloc.py                # SourceLinesOfCodeMetric — code metric
├── tfidf/tfidf.py              # TFIDFMetric — code metric
├── whitespace/whitespace.py    # WhitespaceMetric — code metric
└── git/git.py                  # GitMetrics — code metric, uses PyDriller
```

Responsibility boundary: each metric subpackage implements a `calculate_from_results()` method dispatched by `Analyzer._calculate_code_metric_results`/`_calculate_graph_metric_results` (`analyzer.py:178-220`), which separates metrics by `isinstance(v, AbstractCodeMetric)` vs `isinstance(v, AbstractGraphMetric)`. All are constructed and registered onto an `Analysis` instance from `emerge/config.py` (`config.py:557-683`) based on YAML `file_scan`/`entity_scan` keys.

## `emerge/configs/` — Bundled Configuration Templates

Files: `default.yaml`, `emerge.yaml`, and one `<language>-template.yaml` per major supported language (`c`, `cpp`, `csharp`, `go`, `groovy`, `java`, `javascript`, `kotlin`, `objc`, `py`, `ruby`, `swift`, `typescript`, `vbnet`). These are copied to the user's working directory by `Configuration.parse_args()` when the `-a/--add-config` CLI flag is used (`config.py:202-218`).

## `emerge/output/html/` — Exported Web Application Template

```
output/html/
├── resources/{css,js}/   # emerge_main.js and custom stylesheets
└── vendors/              # d3, bootstrap, jquery, popper, hull, simpleheat, dark-mode-switch, daterangepicker
```

This directory is copied verbatim into each analysis's export directory by `FileManager.copy_force_graph_template_to_export_dir` (`files.py:156-180`), then populated with generated data (`emerge_data.js`) by `D3Exporter.export_d3_force_directed_graph` (`export.py:253-529`). It is a build artifact template, not code executed by the Python runtime.

## `emerge/tests/` — Test Suite

```
tests/
├── config/    test_config.py
├── metrics/   test_number_of_methods.py, test_tfidf.py
├── parsers/   test_<language>_parser.py (one per parser with dedicated coverage) + test_parsing_mixin.py
└── testdata/  <language>.py — literal source-code fixtures per language (e.g. java.py, cpp.py)
```

See `docs/testing-standards.md` for detail on test organization and fixture usage.

## Architectural Boundaries (Level 1, based on import graph observed)

- `emerge/appear.py` depends on `emerge/config.py`, `emerge/analyzer.py`, `emerge/abstractresult.py`, `emerge/log.py`, and every `emerge/languages/*parser.py` module — it is the composition root.
- `emerge/config.py` depends on `emerge/analysis.py`, `emerge/graph.py`, `emerge/log.py`, and every `emerge/metrics/*/*.py` metric module — it is the only place where YAML keys are translated into concrete metric/graph-type instances attached to an `Analysis`.
- `emerge/analyzer.py` depends on `emerge/config.py`, `emerge/analysis.py`, `emerge/graph.py`, `emerge/files.py`, `emerge/stats.py`, `emerge/core.py` — it does not import concrete parser or metric classes directly, only the abstract base types (`AbstractParser`, `AbstractCodeMetric`, `AbstractGraphMetric`), which the injected `Configuration`/parser dictionary satisfy.
- `emerge/analysis.py` depends on `emerge/files.py`, `emerge/graph.py`, `emerge/export.py`, `emerge/stats.py`, `emerge/core.py`, and the abstract parser/result/metric types — it is the boundary between in-memory analysis state and the four export formats.
- `emerge/languages/*` parsers depend on `emerge/abstractparser.py`, `emerge/results.py`, `emerge/abstractresult.py`, `emerge/stats.py`, `emerge/log.py` — they do not depend on `emerge/analyzer.py` or `emerge/config.py`.
