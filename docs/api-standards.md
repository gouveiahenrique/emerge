# API / Interface Standards

This repository is a CLI/tooling project. It does not expose an HTTP API, RPC service, or message queue. Not found in codebase: routes, controllers, request/response middleware, authentication, or authorization — "Not applicable for this repository type" for those categories. The interfaces that exist are: (1) the command-line interface, (2) a YAML configuration contract, (3) an internal parser/metric plugin contract, and (4) file-based export contracts consumed by the bundled HTML/D3 frontend.

## Command-line interface

Defined in `Configuration.setup_commang_line_arguments` (`emerge/config.py:161-173`), using `argparse`:

| Flag | Dest | Behavior |
|---|---|---|
| `-c`, `--config` | `yamlconfig` | Path to a YAML config file to run. |
| `-v`, `--verbose` | `verbose` | Sets logging level to INFO (`action='store_true'`). |
| `-d`, `--debug` | `debug` | Sets logging level to DEBUG. |
| `-e`, `--error` | `error` | Sets logging level to ERROR. |
| `-a`, `--add-config` | `language` | Copies a language config template (`configs/<language>-template.yaml`) into the current working directory. |

Argument handling logic (`Configuration.parse_args`, `emerge/config.py:193-235`):
- If no arguments are supplied, help text is printed and the process returns without analyzing.
- `-a <LANGUAGE>` short-circuits: it copies the matching template file and returns, without requiring `-c`.
- If `-c` is not supplied, help text is printed, an error is logged, and the process returns.
- `-v`/`-d`/`-e` are mutually applied in that order (`emerge/config.py:225-233`) and set `LOGGER.override_level_from_command_line_arg = True`, which then takes precedence over any `loglevel` key in the YAML config (`emerge/config.py:401-410`).

The Docker image fixes the entry point to `["emerge", "-c"]` (`Dockerfile:10`), so a container invocation always supplies a config path as the remaining argument.

## YAML configuration contract

The repository defines and validates a nested YAML schema in `emerge/config.py`. Validity is checked structurally by `Configuration._check_if_yaml_config_is_valid` (`emerge/config.py:303-354`); required keys are enforced, not type-schema-validated against a formal spec (the `_validate_config_against_schema` method in `YamlLoader` is an empty stub, `emerge/config.py:720-724`).

Required top level (`ConfigKeyProject`, `emerge/config.py:50-54`):
- `project_name` (string, required)
- `analyses` (required, non-empty list)
- `loglevel` (optional; one of `debug`/`info`/`error`, see `ConfigValProject`, `emerge/config.py:58-62`)

Each entry in `analyses` (`ConfigKeyAnalysis`, `emerge/config.py:66-89`) must contain `analysis_name` and `source_directory` (both strings), and at least one of `file_scan` or `entity_scan` (`emerge/config.py:340-351`). Recognized optional keys on an analysis entry: `git_directory`, `git_commit_limit`, `git_exclude_merge_commits`, `only_permit_languages`, `only_permit_file_extensions`, `only_permit_files_matching_absolute_path`, `ignore_directories_containing`, `ignore_files_containing`, `ignore_dependencies_containing`, `ignore_dependencies_matching` (regex), `ignore_entities_containing`, `ignore_entities_matching` (regex), `override_resolve_dependencies`, `override_do_not_resolve_dependencies`, `import_aliases`, `export`, `appconfig`.

`file_scan`/`entity_scan` list entries (`ConfigKeyFileScan`, `ConfigKeyEntityScan`, `emerge/config.py:92-115`) select which metrics/graphs get attached to the `Analysis`: `number_of_methods`, `source_lines_of_code`, `dependency_graph`, `fan_in_out`, `louvain_modularity`, `tfidf`, `git` (file scan only), and additionally for entity scan: `number_of_entities`, `inheritance_graph`, `complete_graph`.

`export` list entries (`ConfigKeyExport`, `emerge/config.py:119-127`): `directory: <path>` plus any of `graphml`, `tabular_file`, `tabular_console`, `tabular_console_overall`, `json`, `d3` as bare flags — each maps directly to a boolean on `Analysis` (`emerge/config.py:432-448`).

`appconfig` list entries (`ConfigKeyAppConfig`, `emerge/config.py:131-143`) override default radius/heatmap tuning values used by the D3 export (e.g. `radius_fan_in`, `radius_sloc`, `heatmap_sloc_weight`, `heatmap_score_limit`) — see `Analysis.__init__` (`emerge/analysis.py:59-89`) for the full set of defaults these can override.

Two working example configs exist in the repository: `emerge/configs/default.yaml` (generic file-scan template) and `emerge/configs/emerge.yaml` (emerge's own self-analysis config).

## Internal parser plugin contract

`AbstractParser` (`emerge/languages/abstractparser.py:267-303`) is the contract every language parser implements: `results` (property + setter), `parser_name()` (classmethod), `language_type()` (classmethod), `generate_file_result_from_analysis(analysis, *, file_name, full_file_path, file_content)`, `generate_entity_results_from_analysis(analysis)`, `after_generated_file_results(analysis)`, `create_unique_entity_name(entity)`. `FileScanMapper.choose_parser` (`emerge/files.py:100-152`) maps a file extension to a `Parser` enum name, and `Emerge.__init__` (`emerge/appear.py:54-74`) is the single place that instantiates the concrete parser for each name.

`AbstractMetric` / `AbstractCodeMetric` / `AbstractGraphMetric` (`emerge/metrics/abstractmetric.py`) form the equivalent contract for metrics: `metric_name`, `pretty_metric_name`, `analysis`, `local_data`, `overall_data`, `calculate_from_results(results)`; `AbstractGraphMetric` additionally exposes settable `dependency_graph_representation`, `inheritance_graph_representation`, `complete_graph_representation`.

`AbstractResult` / `AbstractFileResult` / `AbstractEntityResult` (`emerge/abstractresult.py`) define the result contract produced by parsers and consumed by metrics/graphs/exporters.

## Export/data contracts (consumed by the bundled frontend)

`Analysis.export()` (`emerge/analysis.py:274-326`) is the single dispatch point; each format is written by a static method on a corresponding exporter class in `emerge/export.py`:

- **GraphML** — `GraphExporter.export_graph_as_graphml` writes `emerge-<graph_type>.graphml` per existing graph representation.
- **Tabular (console/file)** — `TableExporter.export_statistics_and_metrics_to_console` / `..._as_file` render statistics, overall metrics, and local metrics as `prettytable` tables; file output is written to `emerge-statistics-metrics.txt`.
- **JSON** — `JSONExporter.export_statistics_and_metrics` writes `emerge-statistics-and-metrics.json` with top-level keys `analysis-name`, `statistics`, `overall-metrics`, `local-metrics`.
- **D3** — `D3Exporter.export_d3_force_directed_graph` (`emerge/export.py:253-529`) writes one `emerge-<graph_type>-data.json` per graph representation (networkx node-link JSON via `json_graph.node_link_data`) and a single `emerge_data.js` file consumed by the HTML app, defining JS `const`/`let` bindings: `<graph_type>`, `<graph_type>_statistics`, `<graph_type>_overall_metric_results`, `<graph_type>_cluster_metrics_map`, `analysis_name`, `analysis_config` (radius multipliers, heatmap/churn/hotspot config), and conditionally `commit_metrics`/`git_metrics` when `analysis.include_git_metrics` is set. `emerge_data.js` is written into `<export_dir>/html/resources/js/emerge_data.js` (`emerge/export.py:523-529`), inside the directory tree that `FileManager.copy_force_graph_template_to_export_dir` copies from `emerge/output/html` (`emerge/files.py:156-180`). This is the sole documented contract between the Python backend and the JS/D3 frontend in `emerge/output/html/resources/js/`.

Not found in codebase: a formal JSON Schema or OpenAPI-style spec for these export formats — the contract is implicit in the exporter code and the frontend JS that reads the generated `const`/`let` bindings.
