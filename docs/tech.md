# Technical Overview

## Repository Classification

- Repository type: CLI/tooling application (single-run source-code analysis tool that also emits a static web app as output artifact).
- Primary language: Python. The repository implements `emerge/main.py`, `emerge/appear.py`, `emerge/config.py`, `emerge/analyzer.py`, `emerge/analysis.py`, and the `emerge/languages/*` and `emerge/metrics/*` packages in Python.
- Secondary language present in the repository as generated/vendored output: JavaScript and CSS under `emerge/output/html/` (a D3-based single-page application template that is copied into each analysis export directory, not executed by the Python runtime itself).
- Not found in codebase: any indication that this repository is a backend/API service, a mobile application, or an infrastructure/IaC project.

## Repository Purpose (based on evidence)

The repository implements a command-line tool named `emerge` (PyPI package `emerge-viz`, per `setup.py:27`) that scans a given source directory, parses source files with one of 19 registered per-language parsers (`emerge/appear.py:54-74`), computes code and graph metrics, and exports the results (tabular console/file, JSON, GraphML, and an interactive D3/Bootstrap HTML application). This description is drawn directly from `setup.py`, `emerge/appear.py`, `emerge/analyzer.py`, and `emerge/export.py`.

## Languages / Frameworks

Repository-declared runtime dependencies (Level 1 — `requirements.txt`, `setup.py:42-60`):
- `networkx` — the repository builds and manipulates graphs via `networkx.DiGraph` (`emerge/graph.py:14-15,47`).
- `python-louvain` — imported and used for community detection in `emerge/metrics/modularity/modularity.py` (module presence confirmed via `emerge/config.py:24` import of `LouvainModularityMetric`).
- `scikit-learn`, `numpy` — declared dependencies used for the TF-IDF metric (`emerge/metrics/tfidf/tfidf.py`, referenced in `emerge/config.py:25`).
- `PyYAML` — used by `YamlLoader` in `emerge/config.py:17,739-747` to parse the YAML analysis configuration.
- `pyparsing` — used for tokenized dependency extraction, e.g. `emerge/languages/cparser.py:126-136`.
- `PyDriller` — declared dependency, used by the git-based metrics module (`emerge/metrics/git/git.py`, referenced in `emerge/config.py:26`).
- `prettytable` — used to render console/file tabular output in `emerge/export.py:19,53,64,93,124,136,166`.
- `coloredlogs` — used throughout for colored console logging (e.g. `emerge/log.py:11`, and per-module `coloredlogs.install(...)` calls).
- `pyperclip` — imported in `emerge/analysis.py:14`, used to copy the generated web-app path to the clipboard after export.
- `pycodestyle`, `pylint`, `autopep8`, `interrogate` — declared dependencies used for linting/formatting/docstring-coverage tooling (see `docs/dod.md`), not part of runtime analysis logic.
- `wheel`, `py` — declared packaging/test-runner dependencies (`requirements.txt:1,9`); no direct source usage found in inspected files.

Frontend/output template (Level 1, evidenced by file presence, not part of the Python runtime):
- `emerge/output/html/vendors/d3/d3.v7.8.4.min.js` — force-directed graph rendering library, vendored.
- `emerge/output/html/vendors/bootstrap/` — vendored Bootstrap CSS/JS.
- `emerge/output/html/resources/js/emerge_main.js` — hand-written JS controlling the exported web app's interactivity (node selection, search, metrics menu; see `emerge/output/html/resources/js/emerge_main.js:681-868`).

## Runtime Architecture

Entry point chain (Level 1):
1. `emerge.py:9` calls `run()` from `emerge/main.py`.
2. `emerge/main.py:11-13` instantiates `Emerge` (`emerge/appear.py:46`) and calls `emerge.start()`.
3. `Emerge.start()` (`emerge/appear.py:96-108`) parses CLI args via `Configuration.parse_args()`, loads a YAML config file via `Configuration.load_config_from_yaml_file()`, and if valid, calls `start_analyzing()`.
4. `start_analyzing()` (`emerge/appear.py:122-126`) constructs an `Analyzer` (`emerge/analyzer.py:31`) with the current `Configuration` and the dictionary of registered parsers, then calls `Analyzer.start_analyzing()`.
5. `Analyzer.start_analyzing()` (`emerge/analyzer.py:37-54`) iterates every `Analysis` object in `Configuration.analyses` and calls `start_scanning(analysis)` for each.
6. `Analyzer.start_scanning()` (`emerge/analyzer.py:56-105`) performs, in order: filesystem graph creation, file-result creation (`_create_file_results`), optional entity-result creation (`_create_entity_results`), code metric calculation, graph representation calculation and graph metric calculation, then calls `analysis.export()` (`emerge/analysis.py:274-326`).

Also registered as a `console_scripts` entry point `emerge = emerge.main:run` (`setup.py:86-90`), meaning `pip install emerge-viz` installs `emerge` as an executable calling the same `run()` function.

## Major Technical Components

- `emerge/appear.py` — `Emerge` class: owns the `Configuration` instance and the dictionary of all 19 language parser instances; top-level orchestration entry (`appear.py:46-131`).
- `emerge/config.py` — `Configuration`, `YamlLoader`, and multiple `EnumKeyValid`-based key-validation enums; parses CLI args and the YAML config file into one or more `Analysis` objects and attaches configured metrics/graph types to each (`config.py:146-699`).
- `emerge/analyzer.py` — `Analyzer` class: drives the per-analysis scan → metric → export pipeline (`analyzer.py:31-234`).
- `emerge/analysis.py` — `Analysis` class: holds per-analysis state (scan types, metrics, results, graph representations, export flags, heatmap/radius tuning parameters) and implements `export()` (`analysis.py:34-326`).
- `emerge/languages/abstractparser.py` — defines `AbstractParser` (ABC), `ParsingMixin` (shared tokenization/dependency-resolution helpers), the `Parser` enum (19 members) and `LanguageType` enum (19 members) (`abstractparser.py:24-304`).
- `emerge/languages/*.py` — one concrete parser class per language implementing `AbstractParser` (e.g. `CParser` in `cparser.py:37-166`), each producing `FileResult`/`EntityResult` objects.
- `emerge/abstractresult.py` / `emerge/results.py` — `AbstractResult`/`AbstractFileResult`/`AbstractEntityResult` ABCs and their concrete implementations `FileResult`/`EntityResult`.
- `emerge/metrics/abstractmetric.py` and `emerge/metrics/*/*.py` — `AbstractMetric`/`AbstractCodeMetric`/`AbstractGraphMetric` ABCs and one metric implementation per subpackage: `faninout`, `git`, `modularity`, `numberofmethods`, `sloc`, `tfidf`, `whitespace`.
- `emerge/graph.py` — `GraphRepresentation` (wraps a `networkx.DiGraph`), `GraphType` enum (6 members), and `FileSystemNode`/`FileSystemNodeType` for the filesystem graph.
- `emerge/export.py` — `GraphExporter`, `TableExporter`, `JSONExporter`, `D3Exporter` static-method classes, each responsible for one export format.
- `emerge/files.py` — `FileScanMapper` (extension → parser-name mapping), `LanguageExtension` enum, `FileManager` (copies the `output/html` template into the export directory).
- `emerge/log.py` — `Logger` wrapper around the standard `logging` module plus `coloredlogs`, and `LogLevel`/`LogState` enums.
- `emerge/stats.py` — `Statistics` (referenced by `analysis.py:22,134` and `analyzer.py:22`; not read in full during this analysis).
- `emerge/core.py` — utility module providing `format_timedelta` (imported in `analysis.py:24` and `analyzer.py:25`).

## Deployment / Runtime Model

- Distributed as a pip package (`emerge-viz`, PyPI badge in `README.md:5`) installable with `pip install emerge-viz`, exposing the `emerge` console command (`setup.py:86-90`).
- The repository also defines a `Dockerfile` (`Dockerfile:1-10`) that builds from `ubuntu:22.04`, installs `git`, `graphviz`, `graphviz-dev`, and `emerge-viz` via pip, runs as UID `1002`, and sets `ENTRYPOINT ["emerge", "-c"]` — i.e. the container expects a YAML config path as its runtime argument.
- The tool is invoked as a one-shot batch process: it reads a YAML configuration file (`-c`/`--config` CLI flag, `emerge/config.py:164`), performs the configured analyses, writes output to the configured export directory, and exits. Not found in codebase: any persistent server process, HTTP listener, or daemon mode.
- The exported HTML/D3 application (`emerge/output/html/`) is a static asset intended to be opened directly in a browser from the local filesystem (`analysis.py:324-326`: `LOGGER.info_done(... file://{resolved_export_path}/html/emerge.html ...)`), not served by the Python application itself.
