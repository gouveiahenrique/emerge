# Code Conventions

## Style baseline

`CONTRIBUTING.md:17` states the project's code style "is based on the PEP8 style guide for python code, with a minimal customization of those rules for pylint." This is the repository's own documented convention (Level 1), not an inferred general convention.

Enforced/configured tooling found in the repository:
- `.flake8` sets `max-line-length=140`.
- `.pylintrc` sets `max-line-length=160` under `[FORMAT]`, and disables `C0114` (missing-module-docstring), `C0115` (missing-class-docstring), `C0116` (missing-function-docstring), `C0303` (trailing-whitespace) under `[MASTER]`, plus `F0401` under `[MESSAGES CONTROL]`.
- `.vscode/tasks.json` runs a narrowed pylint invocation (`--disable=all --enable=F,E,unneeded-not,invalid-name,unidiomatic-typecheck,...`) rather than the full default rule set.
- `CONTRIBUTING.md:21` notes Pylance is used in "basic" mode, with full type-checking mode listed as a future item — i.e., static type checking is not currently enforced across the codebase.

## Module-level conventions (observed consistently across inspected files)

- Every inspected module opens with a short triple-quoted docstring summarizing the module's purpose, followed by an `# Authors:` and `# License: MIT` comment pair (e.g. `emerge/config.py:1-6`, `emerge/graph.py:1-6`, `emerge/analysis.py:1-6`, `emerge/files.py:1-7`).
- Each module that logs typically instantiates a module-level `LOGGER = Logger(logging.getLogger('<name>'))` immediately followed by `coloredlogs.install(level='E', logger=LOGGER.logger(), fmt=Logger.log_format)` (e.g. `emerge/config.py:34-35`, `emerge/analyzer.py:27-28`, `emerge/analysis.py:30-31`, `emerge/graph.py:19-20`). Logger names observed: `'parser'`, `'metrics'`, `'config'`, `'analysis'`, `'graph'`, `'emerge'` — matching the `ALL_LOGGERS` list in `emerge/log.py:12`.

## Naming conventions

- Classes: `PascalCase` (`Configuration`, `Analyzer`, `Analysis`, `GraphRepresentation`, `FileResult`, `EntityResult`, `AbstractParser`).
- Functions/methods/variables: `snake_case` (`start_analyzing`, `generate_file_result_from_analysis`, `scanned_import_dependencies`).
- Private/internal methods prefixed with a single underscore (`_create_filesystem_graph`, `_calculate_code_metric_results`, `_collect_all_results`, `emerge/analyzer.py`).
- Enum members: `UPPER_SNAKE_CASE`, defined with `@unique` and `auto()` (`GraphType`, `LanguageType`, `Parser`, `ConfigKeyAnalysis`, `Statistics.Key`).
- One enum class, `EnumLowerKebabCase` (`emerge/metrics/abstractmetric.py:14-17`), overrides `_generate_next_value_` so its members' `.value` renders as lower-kebab-case instead of the member name — used by `MetricKeys`.
- Config keys in YAML are matched against enum member names lowercased (`ConfigKeyProject.PROJECT_NAME.name.lower()` → `project_name`), giving a direct, mechanical mapping between YAML keys and the `ConfigKey*` enums in `emerge/config.py`.

## Architectural pattern: abstract base class + registry

The repository consistently uses `abc.ABC` + `@abstractmethod` to define a contract, then a concrete registry dict keyed by a `classmethod` name:

- `AbstractParser` (`emerge/languages/abstractparser.py:267-303`) is implemented by one concrete class per language; `Emerge.__init__` builds `self._parsers: Dict[str, AbstractParser]` keyed by each parser's `parser_name()` classmethod (`emerge/appear.py:54-74`).
- `AbstractMetric` / `AbstractCodeMetric` / `AbstractGraphMetric` (`emerge/metrics/abstractmetric.py`) follow the same shape; concrete metrics are instantiated and inserted into `Analysis.metrics_for_file_results` / `metrics_for_entity_results` dicts keyed by `metric_name` (`emerge/config.py:566-624`).
- `AbstractResult` / `AbstractFileResult` / `AbstractEntityResult` (`emerge/abstractresult.py`) are implemented by `FileResult` and `EntityResult` (`emerge/results.py`).

This pattern is applied identically for parsers, metrics, and results — new language/metric/result support is added by writing one new concrete class per abstract interface plus one new registry entry, mirroring the existing entries (not a stated goal in the code, but the mechanical, repeated shape of the existing implementations).

## Enum-driven validation pattern

`EnumKeyValid` (`emerge/config.py:38-46`) is a small mixin (`@classmethod valid(cls, key)`) reused by every `ConfigKey*` enum to check whether a YAML key name is recognized (`hasattr(cls, key.upper())`), rather than validating against an external schema library.

## Property pattern for result/entity classes

`FileResult` and `EntityResult` (`emerge/results.py`) store all state in `_`-prefixed instance attributes set in `__init__`, exposed through paired `@property` / `@x.setter` methods matching the abstract interface's declared properties one-to-one (e.g. `unique_name`, `absolute_name`, `display_name`, `scanned_import_dependencies`, `metrics` in both classes).

## Formatting/docstring conventions

- Function/method docstrings, where present, use the Google-style `Args:` / `Returns:` sections (e.g. `emerge/analysis.py:173-182`, `emerge/files.py:99-105`), though docstring coverage is partial (`CONTRIBUTING.md:22`).
- `# pylint: disable=<rule>` inline comments are used locally to suppress specific pylint warnings at the point they occur (e.g. `# pylint: disable=too-many-nested-blocks,too-many-statements` at `emerge/config.py:392`, `# pylint: disable=broad-except` at `emerge/languages/abstractparser.py:125`), rather than disabling rules globally beyond what `.pylintrc` already disables.

## Error handling pattern

Exceptions are raised as bare/builtin exceptions with an f-string message at explicit precondition checks (e.g. `raise NotADirectoryError(f'error in analysis {analysis.analysis_name}: source directory not found/ accessible: {analysis.source_directory}')`, `emerge/analyzer.py:76`; `raise Exception('source directory is not set')`, `emerge/analyzer.py:71`) — no custom exception class hierarchy was found in the codebase. Parsing failures are handled by catching `pyparsing.ParseException` locally, logging a warning, and incrementing a `Statistics.Key.PARSING_MISSES` counter rather than propagating (e.g. `emerge/languages/goparser.py:129-133`, `emerge/results.py:390-396`).
