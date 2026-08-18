# Definition of Done

Every task is only complete when **all commands below pass with zero errors**.

Before marking any task complete, run each command in order, wait for it to finish, and paste
the full terminal output in your response. A task without this output is **incomplete**.

Note on discovery: this repository has neither `package.json` nor `pyproject.toml`. It is packaged with `setup.py` (`setup.py`) and its lint/test commands are defined in `.flake8`, `.pylintrc`, and `.vscode/tasks.json` rather than script aliases. The commands below are taken directly from those files.

## Commands

```bash
# Lint (style/line-length check, config: .flake8)
flake8 emerge

# Lint (error/warning-focused check, exact invocation from .vscode/tasks.json "pylint emerge" task)
pylint --msg-template "{path}:{line}:{column}:{category}:{symbol} - {msg}" \
  --disable=all \
  --enable=F,E,unneeded-not,invalid-name,unidiomatic-typecheck,too-many-lines,multiple-imports,comparison-with-itself,cyclic-import,too-many-ancestors,too-many-branches,too-many-statements,consider-using-join,bad-classmethod-argument,unused-argument,protected-access,abstract-method,unreachable,duplicate-key,unnecessary-semicolon,global-variable-not-assigned,unused-variable,binary-op-exception,bad-format-string,anomalous-backslash-in-string,bad-open-mode \
  emerge

# Test (unittest discovery over emerge/, plus interrogate docstring-coverage report), from run_tests.py
python run_tests.py

# Build (source distribution + wheel, matches the artifacts already present under dist/)
python setup.py sdist bdist_wheel
```

## Rules

- Run all commands even if an earlier one fails — report all failures together.
- Do not suppress, skip, or ignore any failure.
- Fix the root cause and re-run from step 1 until all commands pass.
- If a command is not applicable for the change, explain why — do not silently skip it.
