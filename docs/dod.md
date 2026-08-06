# Definition of Done

Every task is only complete when **all commands below pass with zero errors**.

Before marking any task complete, run each command in order, wait for it to finish, and paste
the full terminal output in your response. A task without this output is **incomplete**.

## Commands

```bash
# Lint (config discovered at .pylintrc and .flake8; no lint script/target is defined in
# package tooling, so both configured linters are invoked directly against the package)
pylint emerge
flake8 emerge

# Test (discovered from run_tests.py, which wraps unittest discovery + interrogate
# docstring-coverage reporting; no test:ci alias exists, this is the project's own test runner)
python run_tests.py

# Build (discovered from setup.py, a setuptools-based package with no separate build script)
python setup.py sdist bdist_wheel
```

## Rules

- Run all commands even if an earlier one fails — report all failures together.
- Do not suppress, skip, or ignore any failure.
- Fix the root cause and re-run from step 1 until all commands pass.
- If a command is not applicable for the change, explain why — do not silently skip it.

## Notes (evidence)

- No `package.json`/`pyproject.toml` was found in the repository root; this project uses `setup.py` + `requirements.txt` for packaging (Level 1 — files present at repository root).
- No `tox.ini`, `Makefile`, `noxfile.py`, or `.github/workflows/*` were found, so no CI-defined lint/test/build aliases exist to read from; the commands above are the direct invocations of the tools whose configuration files are checked into the repository (`.pylintrc`, `.flake8`) and the project's own test entry point (`run_tests.py`).
- `run_tests.py` itself runs `unittest.TestLoader().discover('emerge')` then computes `interrogate` docstring coverage over `"."` (`run_tests.py:12-22`) — both effects occur under the single `python run_tests.py` invocation.
