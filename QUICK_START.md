# Quick Start

## Windows

### Recommended method

1. Install Python 3.10 or later.
2. Open PowerShell in the project directory.
3. Run:

```powershell
python .\start.py
```

You can also use:

```powershell
py -3 .\start.py
```

Or double-click `run.bat`.

### VS Code

Use **Run Python File in Terminal** or run `python .\start.py` in the terminal. Avoid extensions that incorrectly prepend Linux commands such as `/usr/bin/env` in Windows PowerShell.

### Windows security prompt

A downloaded ZIP or script may carry a Windows internet-origin marker. This warning does not by itself mean malware was detected. Only run files whose source and contents you trust. You can inspect `run.bat`, `start.py`, and `app.py` directly because all source code is included.

## macOS / Linux

```bash
chmod +x run.sh
./run.sh
```

Or:

```bash
python3 start.py
```

## Address and ports

The default address is:

```text
http://127.0.0.1:5000
```

If port 5000 is unavailable, the launcher tries ports 5001 through 5010.

## Canvas controls

The canvas toolbar contains three independent interaction modes:

- **Select**: select a person or relationship without entering a personal network or replacing unfinished sidebar input.
- **Focus**: click a person to display the selected 1–3 degree relationship network.
- **Quick link**: click two people in sequence to create a relationship using the current relationship form settings.

Use **Auto arrange** to reorganize the full graph or the currently focused subnetwork. Imported people without avatars are assigned built-in avatars according to gender.

## Troubleshooting

- `python` not found: install Python 3.10+ and add it to PATH.
- Browser did not open: copy the address shown in the terminal into your browser.
- Startup failed: inspect `startup.log` in the project directory.
- Port unavailable: close the process using ports 5000—5010, then restart.
