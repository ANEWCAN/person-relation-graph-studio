from __future__ import annotations

import importlib.util
import io
import json
import threading
import unittest
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("relationship_app", ROOT / "app.py")
APP = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(APP)


class ParserTests(unittest.TestCase):
    def test_avatar_library_is_complete(self) -> None:
        manifest = json.loads((ROOT / "static" / "avatars" / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(len(manifest), 100)
        self.assertEqual(sum(item["gender"] == "male" for item in manifest), 50)
        self.assertEqual(sum(item["gender"] == "female" for item in manifest), 50)
        self.assertEqual(len({item["id"] for item in manifest}), 100)
        catalog = APP.avatar_catalog()
        self.assertEqual(len(catalog), 100)
        self.assertEqual(sum(item["gender"] == "male" for item in catalog), 50)
        self.assertEqual(sum(item["gender"] == "female" for item in catalog), 50)
        for item in catalog:
            path = ROOT / item["url"].split("?", 1)[0].lstrip("/")
            self.assertTrue(path.is_file(), item["id"])

    def test_all_code_filenames_are_ascii(self) -> None:
        code_extensions = {".py", ".js", ".html", ".css", ".bat", ".sh"}
        invalid = [str(path.relative_to(ROOT)) for path in ROOT.rglob("*") if path.is_file() and path.suffix.lower() in code_extensions and not path.name.isascii()]
        self.assertEqual(invalid, [])

    def test_csv_import_creates_nodes(self) -> None:
        content = "source,target,relation,source_gender,target_gender,directed,weight,color\n林澈,苏晴,同事,male,female,false,3,#64748B\n".encode("utf-8")
        graph = APP.parse_csv_bytes(content)
        self.assertEqual(len(graph["nodes"]), 2)
        self.assertEqual(len(graph["edges"]), 1)
        self.assertFalse(graph["edges"][0]["directed"])

    def test_xlsx_round_trip(self) -> None:
        nodes, edges = APP.sample_template_data()
        payload = APP.workbook_bytes(nodes, edges)
        self.assertTrue(payload.startswith(b"PK"))
        graph = APP.parse_excel_bytes(payload)
        self.assertEqual([node["name"] for node in graph["nodes"]], ["林澈", "苏晴"])
        self.assertEqual(graph["edges"][0]["relation"], "同事")

    def test_graphml_export(self) -> None:
        nodes, edges = APP.sample_template_data()
        payload = APP.graphml_bytes(nodes, edges)
        self.assertIn(b"graphml", payload)
        self.assertIn("林澈".encode("utf-8"), payload)


class HttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.server = APP.ThreadingHTTPServer(("127.0.0.1", 0), APP.RelationshipGraphHandler)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.port}"

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def get(self, path: str) -> tuple[int, bytes, dict[str, str]]:
        with urllib.request.urlopen(self.base + path, timeout=5) as response:
            return response.status, response.read(), dict(response.headers)

    def post_json(self, path: str, payload: dict) -> tuple[int, bytes, dict[str, str]]:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(self.base + path, data=data, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(request, timeout=5) as response:
            return response.status, response.read(), dict(response.headers)

    def test_home_and_assets(self) -> None:
        status, body, _ = self.get("/")
        self.assertEqual(status, 200)
        self.assertIn("人物关系图谱工作台".encode("utf-8"), body)
        status, body, _ = self.get("/static/js/app.js")
        self.assertEqual(status, 200)
        self.assertIn(b"class GraphView", body)
        status, body, _ = self.get("/api/avatars")
        self.assertEqual(status, 200)
        payload = json.loads(body)
        self.assertEqual(payload["counts"], {"male": 50, "female": 50})
        self.assertEqual(len(payload["avatars"]), 100)
        for avatar in payload["avatars"]:
            status, svg, headers = self.get(avatar["url"])
            self.assertEqual(status, 200)
            self.assertIn(b"<svg", svg)
            self.assertIn("image/svg+xml", headers.get("Content-Type", ""))

    def test_import_text_and_export_xlsx(self) -> None:
        graph = {"nodes": [{"id": "a", "name": "甲", "gender": "male"}, {"id": "b", "name": "乙", "gender": "female"}], "edges": [{"source": "a", "target": "b", "relation": "朋友"}]}
        status, body, _ = self.post_json("/api/import-text", {"format": "json", "text": json.dumps(graph, ensure_ascii=False)})
        self.assertEqual(status, 200)
        parsed = json.loads(body)
        self.assertTrue(parsed["ok"])
        status, body, headers = self.post_json("/api/export/xlsx", {"graph": graph})
        self.assertEqual(status, 200)
        self.assertTrue(body.startswith(b"PK"))
        self.assertIn("attachment", headers.get("Content-Disposition", ""))
        round_trip = APP.parse_excel_bytes(body)
        self.assertEqual(len(round_trip["nodes"]), 2)
        self.assertEqual(len(round_trip["edges"]), 1)

    def test_multipart_json_upload(self) -> None:
        boundary = "----RelationshipGraphBoundary"
        graph = {"nodes": [{"id": "x", "name": "测试人物", "gender": "male"}], "edges": []}
        file_bytes = json.dumps(graph, ensure_ascii=False).encode("utf-8")
        body = (
            f"--{boundary}\r\n"
            'Content-Disposition: form-data; name="file"; filename="graph.json"\r\n'
            "Content-Type: application/json\r\n\r\n"
        ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")
        request = urllib.request.Request(
            self.base + "/api/import",
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=5) as response:
            parsed = json.loads(response.read())
        self.assertTrue(parsed["ok"])
        self.assertEqual(parsed["summary"]["nodes"], 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
