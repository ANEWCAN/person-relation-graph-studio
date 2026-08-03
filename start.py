"""Windows/macOS/Linux launcher for Person Relationship Graph Studio.

This launcher keeps useful diagnostics, selects an available local port,
and opens the browser automatically. It uses Python's standard library only.
"""
from __future__ import annotations

import datetime as _dt
import socket
import sys
import traceback
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
LOG_FILE = BASE_DIR / "startup.log"
MIN_VERSION = (3, 10)


def _write_log(message: str) -> None:
    stamp = _dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        with LOG_FILE.open("a", encoding="utf-8") as file:
            file.write(f"[{stamp}] {message}\n")
    except OSError:
        pass


def _pause_on_error() -> None:
    if sys.stdin and sys.stdin.isatty():
        try:
            input("\n按 Enter 键关闭此窗口……")
        except (EOFError, KeyboardInterrupt):
            pass


def _find_port(start: int = 5000, end: int = 5010) -> int:
    for port in range(start, end + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                probe.bind(("127.0.0.1", port))
            except OSError:
                continue
            return port
    raise RuntimeError(f"端口 {start}—{end} 均被占用，请关闭相关程序后重试。")


def main() -> int:
    print("=" * 62)
    print("人物关系图谱工作台 · 启动器")
    print("=" * 62)

    if sys.version_info < MIN_VERSION:
        current = ".".join(map(str, sys.version_info[:3]))
        raise RuntimeError(
            f"当前 Python 版本为 {current}，需要 Python 3.10 或更高版本。"
        )

    sys.path.insert(0, str(BASE_DIR))
    from app import run_server

    port = _find_port()
    url = f"http://127.0.0.1:{port}"
    _write_log(f"启动成功，Python={sys.version.split()[0]}，地址={url}")
    print(f"Python 版本：{sys.version.split()[0]}")
    if port != 5000:
        print(f"端口 5000 已被占用，已自动改用端口 {port}。")
    run_server(host="127.0.0.1", port=port, open_browser=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        _write_log("用户通过键盘停止服务。")
        print("\n服务已停止。")
    except SystemExit as exc:
        # Preserve a normal exit; pause only for non-zero status.
        code = exc.code if isinstance(exc.code, int) else 0
        if code not in (0, None):
            _write_log(f"启动器退出，状态码={code}")
            _pause_on_error()
        raise
    except BaseException as exc:
        details = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
        _write_log("启动失败：\n" + details)
        print("\n启动失败：")
        print(str(exc))
        print(f"\n详细日志已保存到：{LOG_FILE}")
        print("常见原因：未安装 Python 3.10+、安全软件拦截，或项目文件不完整。")
        _pause_on_error()
        raise SystemExit(1)
