# Technical Overview

## Repository purpose

The repository implements `emerge` (package name `emerge-viz`), a command-line tool that scans a source code tree, extracts file/entity-level structure, calculates code and graph metrics, and exports the results as GraphML, JSON, tabular text, and an interactive D3-based HTML application (`README.md`, `setup.py`).

Evidence: `setup.py:33` sets `description="Visualize source code structure and dependencies in an interactive d3 application"`; the console-script entry point `emerge = emerge.main:run` (`setup.py:74-78`) is the packaged CLI entry point.

## Repository classification

- Repository type: CLI/tooling (Python static-analysis and visualization tool).
- Primary language: Python (`emerge/*.py`, `emerge/languages/*.py`, `emerge/metrics/*.py`).
- Secondary content: a bundled HTML/JS/CSS frontend used only as an export/output template (`emerge/output/html/`), including vendored third-party libraries (`emerge/output/html/vendors/d3`, `bootstrap`, `jquery`, `popper`, `hull`, `simpleheat`, `dark-mode-switch`, `daterangepicker`).
- Runtime model: single-process, synchronous batch CLI invocation — parses a YAML config, runs one or more analyses in sequence, then exits (`emerge/analyzer.py:37-55`).
- Deployment model: distributed as a PyPI package (`emerge-viz`, `dist/emerge_viz-2.0.0-py3-none-any.whl`, `dist/emerge_viz-2.0.0.tar.gz`) and as a Docker image built `FROM ubuntu:22.04` that installs `emerge-viz` via pip and sets `ENTRYPOINT ["emerge", "-c"]` (`Dockerfile`).

## Languages and frameworks

Repository implementation dependencies, as declared in `setup.py:41-58` / `requirements.txt`:
- `networkx` — directed graph construction and algorithms (`emerge/graph.py:14`, `emerge/analysis.py`).
- `scikit-learn`, `numpy` — used by the TF-IDF metric (`emerge/metrics/tfidf/tfidf.py`).
- `python-louvain` — Louvain modularity/community detection (`emerge/metrics/modularity/modularity.py`).
- `pyparsing` — grammar-based token parsing used across language parsers (`emerge/languages/*.py`, e.g. `emerge/languages/goparser.py:174-194`).
- `PyDriller` — git history mining, used by git-based metrics (`emerge/metrics/git/git.py`).
- `PyYAML` — YAML configuration loading (`emerge/config.py:17,739`).
- `coloredlogs` — colorized console log formatting (imported in nearly every module, e.g. `emerge/log.py:11`).
- `prettytable` — console/file tabular export (`emerge/export.py:19`).
- `pyperclip` — copies the generated HTML app path to the clipboard (`emerge/analysis.py:14`).
- `interrogate` — docstring coverage checked by `run_tests.py`.
- `pylint`, `pycodestyle`, `autopep8` — declared install dependencies used for linting/formatting during development.

Framework/platform capability (not repository-authored, but consumed at runtime by the exported artifact): the exported HTML app in `emerge/output/html/` runs against vendored **D3.js v7.8.4** (`emerge/output/html/vendors/d3/d3.v7.8.4.min.js`) and **Bootstrap** for layout — these are third-party client-side libraries invoked by the generated HTML, not built by this repository's Python code.

Not found in codebase: any web framework (Flask/Django/FastAPI), any test framework beyond the standard library `unittest`, and any async/concurrency runtime — the analyzer loop is single-threaded and sequential (`emerge/analyzer.py:45-54`).

## Runtime architecture

Evidence-based execution flow (`emerge.py` → `emerge/main.py` → `emerge/appear.py` → `emerge/analyzer.py` → `emerge/analysis.py`):

1. `emerge.py:11-13` calls `run()` in `emerge/main.py`, which instantiates `Emerge` (`emerge/appear.py:46`) and calls `.start()`.
2. `Emerge.__init__` (`emerge/appear.py:50-78`) registers one `AbstractParser` subclass per supported language (19 parsers listed at `emerge/appear.py:54-74`) and builds the CLI argument parser via `Configuration.setup_commang_line_arguments` (`emerge/config.py:161-173`).
3. `Emerge.start()` (`emerge/appear.py:96-108`) parses CLI args, and if a valid YAML config path was given, loads and validates it (`Configuration.load_config_from_yaml_file`, `emerge/config.py:245-249`), then calls `start_analyzing()`.
4. `Analyzer.start_analyzing()` (`emerge/analyzer.py:37-54`) iterates every configured `Analysis` and calls `start_scanning()` for each.
5. `Analyzer.start_scanning()` (`emerge/analyzer.py:56-105`) drives, per analysis: filesystem graph construction (`Analysis.create_filesystem_graph`, `emerge/analysis.py:420-557`), file-result creation via the matched language parser (`FileScanMapper.choose_parser`, `emerge/files.py:100-152`), optional entity-result extraction, code-metric calculation (`_calculate_code_metric_results`), graph-metric calculation and graph construction (`Analysis.calculate_graph_representations`, `emerge/analysis.py:559-593`), and finally `Analysis.export()` (`emerge/analysis.py:274-326`).
6. `Analysis.export()` dispatches to `GraphExporter`, `TableExporter`, `JSONExporter`, and `D3Exporter` (`emerge/export.py`) based on which export options were set in the YAML config (`emerge/config.py:432-448`).

## Major technical components

- **Configuration** (`emerge/config.py`): `Configuration` (CLI argument parsing, YAML config validation/loading) and `YamlLoader` (raw YAML file I/O), plus enum-based config-key/value validators (`ConfigKeyProject`, `ConfigKeyAnalysis`, `ConfigKeyFileScan`, `ConfigKeyEntityScan`, `ConfigKeyExport`, `ConfigKeyAppConfig`).
- **Orchestration** (`emerge/appear.py`, `emerge/analyzer.py`): `Emerge` (top-level facade holding the parser registry and config) and `Analyzer` (drives one or more `Analysis` runs).
- **Analysis state** (`emerge/analysis.py`): `Analysis` holds all per-run configuration, scanned results, metric results, and graph representations, and owns the `export()` call.
- **Language parsers** (`emerge/languages/`): one module per language implementing `AbstractParser` (`emerge/languages/abstractparser.py:267-303`), e.g. `pyparser.py`, `javaparser.py`, `goparser.py`, `cparser.py`, `cppparser.py`, `csharpparser.py`, `vbnetparser.py`, `phpparser.py`, `swiftparser.py`, `kotlinparser.py`, `objcparser.py`, `rubyparser.py`, `groovyparser.py`, `javascriptparser.py`, `typescriptparser.py`, `cssparser.py`, `scssparser.py`, `jsonparser.py`, `twigparser.py`.
- **Results** (`emerge/abstractresult.py`, `emerge/results.py`): `AbstractResult`/`AbstractFileResult`/`AbstractEntityResult` abstract interfaces; `FileResult` and `EntityResult` concrete implementations.
- **Graphs** (`emerge/graph.py`): `GraphRepresentation` (wraps a `networkx.DiGraph`), `GraphType` enum (`FILE_RESULT_DEPENDENCY_GRAPH`, `ENTITY_RESULT_DEPENDENCY_GRAPH`, `ENTITY_RESULT_INHERITANCE_GRAPH`, `ENTITY_RESULT_COMPLETE_GRAPH`, `FILESYSTEM_GRAPH`, `FILE_RESULT_CHANGE_COUPLING_GRAPH`), and `FileSystemNode`.
- **Metrics** (`emerge/metrics/`): `AbstractMetric`/`AbstractCodeMetric`/`AbstractGraphMetric` (`emerge/metrics/abstractmetric.py`) with concrete implementations under `emerge/metrics/faninout/`, `emerge/metrics/modularity/`, `emerge/metrics/numberofmethods/`, `emerge/metrics/sloc/`, `emerge/metrics/tfidf/`, `emerge/metrics/whitespace/`, `emerge/metrics/git/`.
- **Export** (`emerge/export.py`): `GraphExporter` (GraphML), `TableExporter` (console/file tabular output), `JSONExporter`, `D3Exporter` (writes `emerge_data.js` consumed by the bundled HTML app).
- **Filesystem/file-type utilities** (`emerge/files.py`): `FileScanMapper` (extension → parser lookup), `LanguageExtension` enum, `FileManager` (copies the HTML/D3 template to the export directory).
- **Cross-cutting utilities**: `emerge/log.py` (`Logger`, `LogLevel`), `emerge/stats.py` (`Statistics`), `emerge/core.py` (string/time formatting helpers).

## Deployment/runtime model

- Packaged and published as `emerge-viz` on PyPI, installed with `pip install emerge-viz`, invoked as the `emerge` console-script (`setup.py:74-78`).
- Containerized via `Dockerfile`, which installs `git`, `graphviz`, `graphviz-dev`, `python3-pip`, then `pip install emerge-viz`, runs as non-root `USER 1002`, with `ENTRYPOINT ["emerge", "-c"]` — the container always runs emerge with a config file argument supplied at `docker run` time.
- No server process, daemon, or network listener was found in the codebase — the tool runs to completion for each configured analysis and exits.
