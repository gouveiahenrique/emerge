# Code Conventions

## Style Baseline (Level 1 — declared in `CONTRIBUTING.md:17-22`)

The repository states its own convention: "The code style in this project is based on the PEP8 style guide for python code, with a minimal customization of those rules for pylint." This is a project-stated convention, evidenced by the presence and content of `.pylintrc` and `.flake8`.

Lint configuration on disk:
- `.pylintrc:1-12` disables `C0114` (missing-module-docstring), `C0115` (missing-class-docstring), `C0116` (missing-function-docstring), `C0303` (trailing-whitespace), and `F0401`; sets `max-line-length=160`.
- `.flake8:1-2` sets `max-line-length=140`.

`CONTRIBUTING.md:21` notes Pylance is used in this project's editor tooling with type-checking mode off ("basic mode is a point in the future roadmap") — i.e. static type checking is not currently enforced despite the presence of type hints in source (see below).

## Naming Conventions (Level 1 — observed across inspected files)

- Modules: lowercase, no underscores, matching the primary class they define (e.g. `abstractparser.py` defines `AbstractParser`; `analyzer.py` defines `Analyzer`).
- Classes: `PascalCase` (e.g. `Analysis`, `Analyzer`, `Configuration`, `GraphRepresentation`, `FanInOutMetric`).
- Abstract base classes: prefixed `Abstract` (`AbstractParser`, `AbstractResult`, `AbstractFileResult`, `AbstractEntityResult`, `AbstractMetric`, `AbstractCodeMetric`, `AbstractGraphMetric`), all built on Python's `abc.ABC`/`abstractmethod` (`abstractparser.py:11,267`; `abstractresult.py:8,13`; `abstractmetric.py:8,36`).
- Enums: `PascalCase` class name, `UPPER_SNAKE_CASE` members, decorated with `@unique` from the `enum` module throughout (e.g. `Parser`, `LanguageType`, `CoreParsingKeyword` in `abstractparser.py:24,47,69`; `ConfigKeyProject`, `ConfigKeyAnalysis`, etc. in `config.py:49-143`; `GraphType`, `GraphFilter` in `graph.py:23,34`).
- A custom enum helper pattern: `EnumKeyValid` (`config.py:38-46`) is mixed into every `ConfigKey*` enum to provide a `valid(cls, key)` classmethod checking `hasattr(cls, key.upper())`, letting YAML string keys be validated against enum member names.
- A custom enum value-generation pattern: `EnumLowerKebabCase` (`abstractmetric.py:15-18`) overrides `_generate_next_value_` so `auto()` members produce lower-kebab-case string values (e.g. `MetricKeys.NUMBER_OF_METHODS` → `"number-of-methods"`).
- Private/internal attributes: prefixed with a single underscore and exposed via `@property` (e.g. `Analysis._start_time`/`_stop_time` in `analysis.py:130-131`; `EntityResult._unique_name` etc. in `results.py:42-55` exposed via `@property def unique_name` in `abstractresult.py:15-23`).
- Methods intended as internal helpers: prefixed with a single underscore (e.g. `Configuration._validate_config`, `_update_attributes_from_yaml_config`, `_invalid_yaml_config` in `config.py:388,393,251`; `Analyzer._create_file_results`, `_calculate_code_metric_results` in `analyzer.py:113,178`).

## File Organization Pattern

- One primary class per module in the top-level `emerge/` package (`Analysis` in `analysis.py`, `Analyzer` in `analyzer.py`, `Configuration`+`YamlLoader` in `config.py`).
- Language parsers follow a strict one-file-per-language layout under `emerge/languages/`, each importing the same shared base (`AbstractParser`, `ParsingMixin`, `Parser`, `CoreParsingKeyword`, `LanguageType` from `abstractparser.py`) and the same result types (`FileResult`, `EntityResult` from `results.py`; `AbstractResult`, `AbstractFileResult`, `AbstractEntityResult` from `abstractresult.py`) — see the shared import block pattern at `vbnetparser.py:11-15`.
- Metrics follow a one-subpackage-per-metric layout under `emerge/metrics/<metric_name>/<metric_name>.py`, each with its own `__init__.py`.
- Every source file inspected begins with a module-level docstring describing its contents in one or two lines (e.g. `abstractparser.py:1-3`, `analysis.py` implicit via class docstring, `graph.py:1-3`, `log.py:1-3`), followed by a comment block: `# Authors: Grzegorz Lato <grzegorz.lato@gmail.com>` / `# License: MIT`.

## Architectural / Implementation Patterns (Level 1)

- **Abstract base class + concrete implementation per language/metric**: every parser subclasses `AbstractParser` and implements its declared abstract properties/methods (`results`, `parser_name`, `language_type`, `generate_entity_results_from_analysis`, `generate_file_result_from_analysis`, `after_generated_file_results`, `create_unique_entity_name`) — see `abstractparser.py:267-304` for the contract and `cparser.py:37-107` for one implementation.
- **Mixin for shared parsing utilities**: `ParsingMixin` (`abstractparser.py:100-264`) supplies tokenization (`preprocess_file_content_and_generate_token_list_by_mapping`), dependency-path resolution (`resolve_relative_dependency_path`), and ignore-list checks (`_is_dependency_in_ignore_list`, `is_entity_in_ignore_list`) shared by all parsers via multiple inheritance (`class CParser(AbstractParser, ParsingMixin)`, `cparser.py:37`).
- **Enum-driven configuration validation**: rather than a schema library, `Configuration` validates YAML input by checking dictionary keys against the `name.lower()` of enum members (e.g. `config.py:319-321,324-327`), and the `EnumKeyValid.valid()` helper generalizes this check.
- **Static-method-only exporter classes**: `GraphExporter`, `TableExporter`, `JSONExporter`, `D3Exporter` (`export.py:28-529`) contain no instance state — every method is `@staticmethod`, and only `export.py`'s callers (`Analysis.export()`) pass in already-computed data.
- **Dependency injection of parsers into the analyzer**: `Analyzer.__init__` receives a `Dict[str, AbstractParser]` from `Emerge` (`analyzer.py:31-34`, `appear.py:125`) rather than instantiating parsers itself, keeping `Analyzer` decoupled from concrete parser classes.
- **Property-based read/write access with `@abstractmethod` setters that default to no-ops**: several abstract properties define a `@x.setter` decorated with `# pylint: disable=unused-argument` and an empty body, so concrete subclasses can optionally override behavior (e.g. `AbstractParser.results` setter, `abstractparser.py:274-277`; `AbstractGraphMetric.dependency_graph_representation` setter, `abstractmetric.py:75-77`).
- **Type hints used inconsistently but present throughout**: function signatures and instance attributes are annotated with the `typing` module (`Dict`, `List`, `Optional`, `Any`) across most inspected files (e.g. `analysis.py:38-134`), though `CONTRIBUTING.md:21` notes static type checking is not currently enforced in the editor.
- **Logging via a project-specific wrapper, never bare `logging` calls directly for emoji-prefixed output**: every module obtains a `Logger(logging.getLogger('<name>'))` instance and calls `coloredlogs.install(...)` immediately after (repeated identical 2-line pattern at the top of nearly every module, e.g. `cparser.py`/`vbnetparser.py:17-18`, `analysis.py:30-31`, `analyzer.py:27-28`, `config.py:34-35`, `graph.py:19-20`). `Logger` methods prefix messages with a fixed emoji per severity/purpose (`log.py:46-62`).

## Not Found in Codebase

- No configuration for `black`, `isort`, `mypy`, or `ruff` was found in the repository root.
- No `pre-commit` configuration file was found.
- No CI workflow files were found under `.github/` beyond the two issue templates (`.github/ISSUE_TEMPLATE/bug_report.md`, `feature_request.md`) — i.e., no `.github/workflows/` directory was found during this analysis.
