# Contributing

Thank you for considering a contribution to Person Relation Graph Studio.

## Before opening an issue

- Search existing issues to avoid duplicates.
- Include your operating system, Python version, browser, and reproducible steps.
- Remove private relationship data, real personal information, passwords, tokens, and local file paths.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Keep changes focused and avoid unrelated formatting changes.
3. Preserve the zero-third-party-dependency design unless a dependency is clearly justified.
4. Run the automated tests:

```bash
python -m unittest discover -s tests -v
```

5. Describe what changed, why it changed, and how it was tested.

## Code style

- Use English file names and ASCII-safe paths.
- Keep Python compatible with Python 3.10+.
- Prefer native browser APIs and Python standard-library modules.
- Do not commit generated logs, virtual environments, editor settings, exported user data, or secrets.
