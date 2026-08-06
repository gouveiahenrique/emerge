# API / Interface Standards

This repository is a CLI/tooling application, not a backend HTTP/API service and not a frontend application consuming a remote API. "Not applicable for this repository type" applies to REST/GraphQL/RPC route documentation. The interfaces that do exist are: (1) the command-line argument interface, (2) the YAML configuration file contract, and (3) the file-based export contracts (GraphML/JSON/tabular/D3-JS) that other tools or the bundled web app consume.

## Command-Line Interface (Level 1 — `emerge/config.py:161-235`)

Defined in `Configuration.setup_commang_line_arguments()` (`config.py:161-173`) using `argparse`:

| Flag | Dest | Behavior |
|---|---|---|
| `-c`, `--config` | `yamlconfig` | Path to the YAML config file (`config.py:164`) |
| `-v`, `--verbose` | `verbose` | Sets logging level to INFO (`config.py:165,225-227`) |
| `-d`, `--debug` | `debug` | Sets logging level to DEBUG (`config.py:166,228-230`) |
| `-e`, `--error` | `error` | Sets logging level to ERROR (`config.py:167,231-233`) |
| `-a`, `--add-config` | `language` | Copies a bundled config template (`emerge/configs/<language>-template.yaml`) into the current working directory (`config.py:168-173,202-218`) |

`Configuration.parse_args()` (`config.py:193-235`) prints `--help` and returns early if no arguments are given, or if `--config` is missing without `--add-config`.

## YAML Configuration Contract (Level 1 — `emerge/config.py:38-354`)

Validated structurally by `Configuration._check_if_yaml_config_is_valid()` (`config.py:303-354`). Required top-level keys, enforced by the repository's own validation code:

- `project_name` (string) — required (`config.py:319-321`).
- `analyses` (non-empty list) — required (`config.py:330-337,343`).

Each entry in `analyses` must contain, per validation logic:
- `analysis_name` (string) — required (`config.py:344,346`).
- `source_directory` (string) — required (`config.py:345,347`).
- At least one of `file_scan` or `entity_scan` — required (`config.py:348-349`).

Optional per-analysis keys recognized by `_update_attributes_from_yaml_config` (`config.py:393-699`), each documented by the `ConfigKeyAnalysis` enum (`config.py:66-89`): `git_directory`, `git_commit_limit`, `git_exclude_merge_commits`, `only_permit_languages`, `only_permit_file_extensions`, `only_permit_files_matching_absolute_path`, `ignore_directories_containing`, `ignore_files_containing`, `ignore_dependencies_containing`, `ignore_dependencies_matching` (regex), `ignore_entities_containing`, `ignore_entities_matching` (regex), `override_resolve_dependencies`, `override_do_not_resolve_dependencies`, `import_aliases`, `export`, `appconfig`.

`file_scan` accepted values (`ConfigKeyFileScan` enum, `config.py:92-101`): `git`, `ws_complexity`, `number_of_methods`, `source_lines_of_code`, `dependency_graph`, `fan_in_out`, `louvain_modularity`, `tfidf`.

`entity_scan` accepted values (`ConfigKeyEntityScan` enum, `config.py:104-115`): `number_of_methods`, `source_lines_of_code`, `number_of_entities`, `dependency_graph`, `inheritance_graph`, `complete_graph`, `fan_in_out`, `louvain_modularity`, `tfidf`.

`export` accepted values (`ConfigKeyExport` enum, `config.py:118-127`): `directory`, `graphml`, `tabular_file`, `tabular_console`, `tabular_console_overall`, `json`, `d3`.

`appconfig` accepted values (`ConfigKeyAppConfig` enum, `config.py:130-143`): `radius_fan_in`, `radius_fan_out`, `radius_louvain`, `radius_sloc`, `radius_number_of_methods`, `heatmap_sloc_active`, `heatmap_fan_out_active`, `heatmap_sloc_weight`, `heatmap_fan_out_weight`, `heatmap_score_base`, `heatmap_score_limit`.

A concrete example is bundled at `emerge/configs/java-template.yaml`, showing a `project_name`, single `analyses` entry with `only_permit_languages: [java]`, both `file_scan` and `entity_scan` blocks, and an `export` block listing `directory`, `graphml`, `json`, `tabular_file`, `tabular_console_overall`, `d3`.

Unknown top-level or analysis-level keys, a non-list `analyses` value, or missing required keys cause `Configuration.valid` to be set `False` (`config.py:251-254`), and `Emerge.start()` aborts the run (`appear.py:104-108`) without raising further than a logged error.

## Export Contracts (Level 1 — `emerge/export.py`)

Four static-method exporter classes, each triggered conditionally in `Analysis.export()` (`analysis.py:274-326`) based on the analysis's `export_*` boolean flags:

- `GraphExporter.export_graph_as_graphml(graph, export_name, export_dir)` (`export.py:32-34`) — writes `emerge-<graph_type>.graphml` via `networkx.write_graphml`.
- `TableExporter.export_statistics_and_metrics_to_console(...)` / `...as_file(...)` (`export.py:41-185`) — prints/writes a `prettytable`-formatted view of statistics, overall metric results, and (file variant only for console; both for file) local per-result metric results. File output path: `emerge-statistics-metrics.txt`.
- `JSONExporter.export_statistics_and_metrics(...)` (`export.py:192-245`) — writes `emerge-statistics-and-metrics.json` with top-level keys `analysis-name`, `statistics`, `overall-metrics`, `local-metrics`.
- `D3Exporter.export_d3_force_directed_graph(...)` (`export.py:253-529`) — for each active `GraphRepresentation`, writes `emerge-<graph_type>-data.json` (networkx `node_link_data` format) and appends a JS variable declaration to `<export_dir>/html/resources/js/emerge_data.js`, along with `analysis_name`, `analysis_config` (radius multipliers, heatmap weights/limits), and (if `include_git_metrics`) `commit_metrics`/`git_metrics` JS variables. This file is consumed by the vendored `emerge/output/html/resources/js/emerge_main.js` when the exported `emerge.html` is opened in a browser.

All metric/statistic key names beginning with `commit-metrics` or `git-metrics` are explicitly excluded from the generic overall-metrics tabular/JSON output (`export.py:69-70,141-142,215-216,287-288`) and are instead surfaced through the dedicated git-metrics JS variables in the D3 export path.

## External Integrations

Not found in codebase: any outbound HTTP client, third-party API integration, authentication, or authorization logic. The only external-process integration observed is git repository inspection via the `PyDriller` dependency (declared in `requirements.txt:16`, referenced from `emerge/config.py:26` as `GitMetrics`), used when `git_directory`/`git` file-scan metrics are configured.
