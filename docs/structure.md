# Repository Structure

## Top-level layout

```
emerge.py                  # standalone entry script (pip-installed console script wraps emerge.main:run)
setup.py                   # packaging metadata, console_scripts entry point, install_requires
requirements.txt           # flat dependency list (mirrors setup.py install_requires)
run_tests.py               # unittest discovery + interrogate docstring-coverage report
Dockerfile                 # ubuntu:22.04 image, pip-installs emerge-viz, ENTRYPOINT ["emerge", "-c"]
README.md, CONTRIBUTING.md, CREDITS.md, LICENSE
.flake8, .pylintrc, .markdownlint.json   # lint configuration
.vscode/                   # tasks.json defines debug/lint/test shell commands for VS Code
dist/                      # pre-built wheel/sdist artifacts (emerge_viz-2.0.0)
emerge/                    # the package itself (see below)
```

## `emerge/` package

- `emerge/appear.py` — defines the `Emerge` facade class: registers all language parsers, owns the shared `Configuration`, and starts analysis (`start()` → `start_analyzing()`).
- `emerge/main.py` — `run()` function used as the `console_scripts` entry point (`setup.py:76`) and by `emerge.py`.
- `emerge/analyzer.py` — `Analyzer` class: iterates configured analyses and drives the scan → metric → graph → export sequence for each.
- `emerge/analysis.py` — `Analysis` class: per-run state container (config values, results, metrics, graph representations) and the `export()` method.
- `emerge/config.py` — `Configuration` (CLI arg parsing + YAML config validation/application) and `YamlLoader` (raw YAML I/O); also defines all `ConfigKey*`/`ConfigVal*` enums used to validate YAML keys.
- `emerge/graph.py` — `GraphRepresentation`, `GraphType`, `GraphFilter`, `FileSystemNode`, `FileSystemNodeType` — graph construction on top of `networkx.DiGraph`.
- `emerge/abstractresult.py` — `AbstractResult`, `AbstractFileResult`, `AbstractEntityResult` abstract base classes.
- `emerge/results.py` — `FileResult` and `EntityResult`, the concrete result types produced by parsers.
- `emerge/export.py` — `GraphExporter`, `TableExporter`, `JSONExporter`, `D3Exporter`.
- `emerge/files.py` — `FileScanMapper` (file-extension → parser-name mapping), `LanguageExtension` enum, `FileManager` (copies `emerge/output/html` to the export directory), `truncate_directory` helper.
- `emerge/stats.py` — `Statistics` class with a `Key` enum of recognized statistic names.
- `emerge/log.py` — `Logger` wrapper around the standard `logging` module, `LogLevel`/`LogState` enums.
- `emerge/core.py` — free functions: `camel_case_to_words`, `camel_to_kebab_case`, `format_timedelta`, `DeltaTemplate`.

### `emerge/languages/`

One parser module per supported language, each implementing `AbstractParser` (defined in `emerge/languages/abstractparser.py`, which also defines the shared `ParsingMixin`, `LanguageType` enum, `Parser` enum, and `CoreParsingKeyword` enum):

`abstractparser.py`, `cparser.py`, `cppparser.py`, `csharpparser.py`, `cssparser.py`, `goparser.py`, `groovyparser.py`, `javaparser.py`, `javascriptparser.py`, `jsonparser.py`, `kotlinparser.py`, `objcparser.py`, `phpparser.py`, `pyparser.py`, `rubyparser.py`, `scssparser.py`, `swiftparser.py`, `twigparser.py`, `typescriptparser.py`, `vbnetparser.py`.

Dependency boundary: every parser depends on `emerge/abstractresult.py`, `emerge/results.py`, `emerge/stats.py`, and `emerge/log.py`, but parsers do not depend on each other (verified for `goparser.py`, `vbnetparser.py`; general pattern observed, not exhaustively checked against all 19 files).

### `emerge/metrics/`

- `abstractmetric.py` — `AbstractMetric`, `AbstractCodeMetric`, `AbstractGraphMetric`, `MetricKeys`, `MetricResultFilter`.
- `metrics.py` — module present alongside the abstract definitions (not read in detail during this pass).
- Subpackages, one per metric, each with its own `__init__.py`:
  - `faninout/faninout.py` — `FanInOutMetric` (graph metric).
  - `modularity/modularity.py` — `LouvainModularityMetric` (graph metric, uses `python-louvain`).
  - `numberofmethods/numberofmethods.py` — `NumberOfMethodsMetric` (code metric).
  - `sloc/sloc.py` — `SourceLinesOfCodeMetric` (code metric).
  - `tfidf/tfidf.py` — `TFIDFMetric` (code metric, uses `scikit-learn`).
  - `whitespace/whitespace.py` — `WhitespaceMetric` (code metric).
  - `git/git.py` — `GitMetrics` (uses `PyDriller` to mine git history).

Metrics are wired into an `Analysis` from `emerge/config.py` based on the `file_scan`/`entity_scan` lists in the YAML config (`emerge/config.py:556-684`), and are separated into `metrics_for_file_results` and `metrics_for_entity_results` on the `Analysis` object.

### `emerge/output/`

`emerge/output/html/` is the static template for the exported interactive web app: `resources/css`, `resources/js` (application JS, e.g. `emerge_git.js`), and `vendors/` containing bundled third-party libraries (`d3`, `bootstrap`, `jquery`, `popper`, `hull`, `simpleheat`, `dark-mode-switch`, `daterangepicker`). `FileManager.copy_force_graph_template_to_export_dir` (`emerge/files.py:156-180`) copies this directory tree into the configured export directory at export time; `D3Exporter` then writes `emerge_data.js` into the copied tree's `html/resources/js/` path (`emerge/export.py:523-529`).

### `emerge/configs/`

YAML configuration templates, one per supported language plus two operational configs:
`default.yaml` (generic template), `emerge.yaml` (emerge's own self-analysis config, referenced by the VS Code debug task), and `<language>-template.yaml` for each of `c`, `cpp`, `csharp`, `go`, `groovy`, `java`, `javascript`, `kotlin`, `objc`, `py`, `ruby`, `swift`, `typescript`, `vbnet`. These templates are copied to the current working directory by `Configuration.parse_args` when invoked with `-a/--add-config <LANGUAGE>` (`emerge/config.py:202-218`).

### `emerge/tests/`

- `config/test_config.py` — tests for `Configuration`.
- `metrics/test_number_of_methods.py`, `metrics/test_tfidf.py` — tests for individual metrics.
- `parsers/test_<language>_parser.py` — one test module per parser with parser-specific fixtures, plus `test_parsing_mixin.py` for shared `ParsingMixin` behavior.
- `testdata/<language>.py` — literal source-code fixtures (e.g. `PYTHON_TEST_FILES` in `testdata/py.py`) fed into parser tests.

## Architectural boundaries and dependencies

- `emerge/appear.py` → `emerge/config.py`, `emerge/analyzer.py`, `emerge/languages/*` (imports every parser directly to build the static registry at `emerge/appear.py:54-74`).
- `emerge/analyzer.py` → `emerge/config.py`, `emerge/analysis.py`, `emerge/files.py`, `emerge/graph.py`, `emerge/metrics/abstractmetric.py`.
- `emerge/config.py` → `emerge/metrics/*/*.py` (imports every concrete metric class directly, `emerge/config.py:21-27`), `emerge/graph.py`, `emerge/analysis.py`.
- `emerge/analysis.py` → `emerge/files.py`, `emerge/graph.py`, `emerge/export.py`, `emerge/abstractresult.py`, `emerge/languages/abstractparser.py`, `emerge/metrics/abstractmetric.py`.
- `emerge/export.py` → `emerge/graph.py` only (no dependency on `emerge/analysis.py`, avoiding a cycle back to the caller).
- `emerge/files.py` → every module in `emerge/languages/` (extension-to-parser mapping) and `emerge/log.py`.

No dependency from `emerge/languages/*` back into `emerge/config.py`, `emerge/analyzer.py`, or `emerge/analysis.py` was found — parsers only depend on the result/stat/log primitives, keeping the parser layer a leaf in the dependency graph relative to orchestration code.
