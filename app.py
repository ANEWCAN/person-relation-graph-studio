from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import mimetypes
import re
import threading
import uuid
import webbrowser
import zipfile
from datetime import datetime, timezone
from email.parser import BytesParser
from email.policy import default as email_policy
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import unquote, urlparse
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape as xml_escape

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATE_FILE = BASE_DIR / "templates" / "index.html"
ALLOWED_EXTENSIONS = {"json", "csv", "xlsx", "xlsm"}
MAX_UPLOAD_BYTES = 20 * 1024 * 1024
HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
AVATAR_COUNT_PER_GENDER = 50
AVATAR_ASSET_VERSION = "1.3.0"
AVATAR_FILE_PATTERN = re.compile(r"^(male|female)_(\d{2})\.svg$")


class ImportFormatError(ValueError):
    pass


def clean_text(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def normalize_gender(value: Any) -> str:
    raw = clean_text(value, "unknown").lower()
    if raw in {"male", "m", "man", "boy", "男", "男性", "男生"}:
        return "male"
    if raw in {"female", "f", "woman", "girl", "女", "女性", "女生"}:
        return "female"
    return "unknown"


def parse_bool(value: Any, default: bool = False) -> bool:
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    return clean_text(value).lower() in {"1", "true", "yes", "y", "是", "有", "directed", "arrow"}


def parse_weight(value: Any, default: float = 2.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    return max(0.5, min(20.0, number))


def normalize_color(value: Any, default: str = "#64748B") -> str:
    color = clean_text(value, default)
    return color.upper() if HEX_COLOR.match(color) else default


def stable_id(prefix: str, seed: str) -> str:
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()[:12]
    return f"{prefix}_{digest}"


def default_avatar(name: str, gender: str) -> str:
    if gender not in {"male", "female"}:
        return ""
    digest = int(hashlib.md5(name.encode("utf-8")).hexdigest()[:8], 16)
    index = digest % AVATAR_COUNT_PER_GENDER + 1
    return f"/static/avatars/{gender}_{index:02d}.svg"


def assign_missing_avatars(nodes: list[dict[str, Any]]) -> int:
    """Assign stable, gender-matched built-in avatars to nodes without one.

    The first 50 nodes of each supported gender are given distinct avatar files
    whenever possible. Existing custom or imported avatar values are preserved.
    """
    used: dict[str, set[int]] = {"male": set(), "female": set()}
    assigned = 0

    for node in nodes:
        avatar = clean_text(node.get("avatar"))
        match = re.search(r"/(male|female)_(\d{2})\.svg(?:\?|$)", avatar)
        if match:
            gender, index_text = match.groups()
            index = int(index_text)
            if 1 <= index <= AVATAR_COUNT_PER_GENDER:
                used[gender].add(index)

    for node in nodes:
        if clean_text(node.get("avatar")):
            continue
        gender = normalize_gender(node.get("gender"))
        if gender not in used:
            continue
        seed = clean_text(node.get("name")) or clean_text(node.get("id")) or str(assigned)
        preferred = int(hashlib.md5(seed.encode("utf-8")).hexdigest()[:8], 16) % AVATAR_COUNT_PER_GENDER + 1
        index = preferred
        for _ in range(AVATAR_COUNT_PER_GENDER):
            if index not in used[gender]:
                break
            index = index % AVATAR_COUNT_PER_GENDER + 1
        node["avatar"] = f"/static/avatars/{gender}_{index:02d}.svg?v={AVATAR_ASSET_VERSION}"
        used[gender].add(index)
        assigned += 1
    return assigned


def avatar_catalog() -> list[dict[str, Any]]:
    """Build the avatar catalog from files that actually exist on disk.

    The frontend also has generated fallbacks, but this endpoint avoids trusting
    a stale manifest and excludes malformed or missing SVG files.
    """
    avatar_dir = STATIC_DIR / "avatars"
    catalog: list[dict[str, Any]] = []
    for path in sorted(avatar_dir.glob("*.svg"), key=lambda item: item.name):
        match = AVATAR_FILE_PATTERN.match(path.name)
        if not match:
            continue
        gender, index_text = match.groups()
        index = int(index_text)
        if index < 1 or index > AVATAR_COUNT_PER_GENDER:
            continue
        try:
            root = ET.fromstring(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, ET.ParseError):
            continue
        if not root.tag.endswith("svg"):
            continue
        catalog.append({
            "id": f"{gender}_{index:02d}",
            "gender": gender,
            "url": f"/static/avatars/{path.name}?v={AVATAR_ASSET_VERSION}",
            "index": index,
        })
    catalog.sort(key=lambda item: (0 if item["gender"] == "male" else 1, item["index"]))
    return catalog


def normalize_node(raw: dict[str, Any], fallback_name: str = "") -> dict[str, Any]:
    name = clean_text(
        raw.get("name") or raw.get("label") or raw.get("person") or raw.get("人物") or raw.get("姓名"),
        fallback_name or "未命名人物",
    )
    gender = normalize_gender(raw.get("gender") or raw.get("sex") or raw.get("性别"))
    node_id = clean_text(raw.get("id") or raw.get("node_id") or raw.get("人物ID"))
    if not node_id:
        node_id = stable_id("n", name)
    avatar = clean_text(raw.get("avatar") or raw.get("image") or raw.get("头像"))
    tags = raw.get("tags") or raw.get("标签") or []
    if isinstance(tags, str):
        tags = [part.strip() for part in re.split(r"[,，;；|]", tags) if part.strip()]
    elif not isinstance(tags, list):
        tags = []
    node = {
        "id": node_id,
        "name": name,
        "gender": gender,
        "avatar": avatar,
        "note": clean_text(raw.get("note") or raw.get("description") or raw.get("备注") or raw.get("简介")),
        "tags": tags,
    }
    for key in ("x", "y"):
        try:
            if raw.get(key) not in (None, ""):
                node[key] = float(raw[key])
        except (TypeError, ValueError):
            pass
    if raw.get("fixed") not in (None, ""):
        node["fixed"] = parse_bool(raw.get("fixed"))
    return node


def normalize_edge(raw: dict[str, Any], name_to_id: dict[str, str], index: int = 0) -> dict[str, Any] | None:
    source_raw = clean_text(raw.get("source") or raw.get("from") or raw.get("source_id") or raw.get("起点") or raw.get("人物1") or raw.get("源人物"))
    target_raw = clean_text(raw.get("target") or raw.get("to") or raw.get("target_id") or raw.get("终点") or raw.get("人物2") or raw.get("目标人物"))
    if not source_raw or not target_raw:
        return None
    source = name_to_id.get(source_raw, source_raw)
    target = name_to_id.get(target_raw, target_raw)
    relation = clean_text(raw.get("relation") or raw.get("label") or raw.get("关系") or raw.get("关系名称"), "关系")
    edge_id = clean_text(raw.get("id") or raw.get("edge_id") or raw.get("关系ID")) or stable_id("e", f"{source}|{target}|{relation}|{index}")
    line_style = clean_text(raw.get("lineStyle") or raw.get("line_style") or raw.get("style") or raw.get("线型"), "solid").lower()
    if line_style not in {"solid", "dashed", "dotted"}:
        line_style = "solid"
    return {
        "id": edge_id,
        "source": source,
        "target": target,
        "relation": relation,
        "directed": parse_bool(raw.get("directed") if "directed" in raw else raw.get("arrow") or raw.get("是否箭头")),
        "weight": parse_weight(raw.get("weight") or raw.get("width") or raw.get("权重") or raw.get("粗细")),
        "color": normalize_color(raw.get("color") or raw.get("颜色")),
        "lineStyle": line_style,
        "note": clean_text(raw.get("note") or raw.get("备注")),
    }


def dedupe_ids(items: list[dict[str, Any]], prefix: str) -> None:
    used: set[str] = set()
    for item in items:
        base = clean_text(item.get("id"), f"{prefix}_{uuid.uuid4().hex[:8]}")
        candidate = base
        counter = 2
        while candidate in used:
            candidate = f"{base}_{counter}"
            counter += 1
        item["id"] = candidate
        used.add(candidate)


def normalize_graph(raw_nodes: Iterable[dict[str, Any]], raw_edges: Iterable[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    nodes: list[dict[str, Any]] = []
    name_to_id: dict[str, str] = {}
    for raw in raw_nodes:
        if not isinstance(raw, dict):
            continue
        node = normalize_node(raw)
        if node["name"] in name_to_id:
            continue
        nodes.append(node)
        name_to_id[node["name"]] = node["id"]
        name_to_id[node["id"]] = node["id"]

    edge_rows = [row for row in raw_edges if isinstance(row, dict)]
    endpoint_rules = (
        (("source", "from", "source_id", "起点", "人物1", "源人物"), ("source_gender", "人物1性别", "源人物性别")),
        (("target", "to", "target_id", "终点", "人物2", "目标人物"), ("target_gender", "人物2性别", "目标人物性别")),
    )
    for row in edge_rows:
        for endpoint_keys, gender_keys in endpoint_rules:
            endpoint = next((clean_text(row.get(key)) for key in endpoint_keys if row.get(key) not in (None, "")), "")
            if not endpoint or endpoint in name_to_id:
                continue
            gender_value = next((row.get(key) for key in gender_keys if row.get(key) not in (None, "")), None)
            node = normalize_node({"name": endpoint, "gender": gender_value}, fallback_name=endpoint)
            nodes.append(node)
            name_to_id[endpoint] = node["id"]
            name_to_id[node["id"]] = node["id"]

    dedupe_ids(nodes, "n")
    assign_missing_avatars(nodes)
    name_to_id = {node["name"]: node["id"] for node in nodes}
    name_to_id.update({node["id"]: node["id"] for node in nodes})
    node_ids = {node["id"] for node in nodes}
    edges: list[dict[str, Any]] = []
    for index, raw in enumerate(edge_rows):
        edge = normalize_edge(raw, name_to_id, index)
        if edge and edge["source"] in node_ids and edge["target"] in node_ids:
            edges.append(edge)
    dedupe_ids(edges, "e")
    return {"nodes": nodes, "edges": edges}


def parse_json_bytes(content: bytes) -> dict[str, list[dict[str, Any]]]:
    try:
        payload = json.loads(content.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ImportFormatError(f"JSON 解析失败：{exc}") from exc
    if isinstance(payload, dict):
        nodes = payload.get("nodes") or payload.get("人物") or payload.get("entities") or []
        edges = payload.get("edges") or payload.get("关系") or payload.get("links") or []
        if not nodes and not edges and isinstance(payload.get("data"), list):
            edges = payload["data"]
    elif isinstance(payload, list):
        nodes, edges = [], payload
    else:
        raise ImportFormatError("JSON 顶层必须是对象或数组。")
    return normalize_graph(nodes, edges)


def decode_csv(content: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "gb18030", "gbk"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ImportFormatError("CSV 编码无法识别，请使用 UTF-8 或 GB18030。")


def parse_csv_bytes(content: bytes) -> dict[str, list[dict[str, Any]]]:
    reader = csv.DictReader(io.StringIO(decode_csv(content)))
    if not reader.fieldnames:
        raise ImportFormatError("CSV 缺少表头。")
    rows = [dict(row) for row in reader]
    fields = {clean_text(field).lower() for field in reader.fieldnames if field}
    is_node_table = bool(fields & {"name", "姓名", "人物"}) and not bool(fields & {"source", "target", "人物1", "人物2", "起点", "终点"})
    return normalize_graph(rows if is_node_table else [], [] if is_node_table else rows)


# ------------------------------ XLSX (standard-library only) ------------------------------

XLSX_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


def excel_col(index: int) -> str:
    result = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result


def excel_col_index(reference: str) -> int:
    letters = re.match(r"[A-Z]+", reference.upper())
    if not letters:
        return 0
    result = 0
    for char in letters.group(0):
        result = result * 26 + (ord(char) - 64)
    return result - 1


def sheet_xml(rows: list[list[Any]], header_style: bool = True) -> bytes:
    worksheet = ET.Element("worksheet", xmlns=XLSX_NS)
    ET.SubElement(worksheet, "sheetViews")
    ET.SubElement(worksheet, "sheetFormatPr", defaultRowHeight="15")
    sheet_data = ET.SubElement(worksheet, "sheetData")
    for row_index, values in enumerate(rows, 1):
        row_el = ET.SubElement(sheet_data, "row", r=str(row_index))
        for col_index, value in enumerate(values, 1):
            if value is None:
                continue
            cell_attrs = {"r": f"{excel_col(col_index)}{row_index}"}
            if header_style and row_index == 1:
                cell_attrs["s"] = "1"
            if isinstance(value, bool):
                cell_attrs["t"] = "b"
                cell = ET.SubElement(row_el, "c", cell_attrs)
                ET.SubElement(cell, "v").text = "1" if value else "0"
            elif isinstance(value, (int, float)) and not isinstance(value, bool):
                cell = ET.SubElement(row_el, "c", cell_attrs)
                ET.SubElement(cell, "v").text = str(value)
            else:
                cell_attrs["t"] = "inlineStr"
                cell = ET.SubElement(row_el, "c", cell_attrs)
                inline = ET.SubElement(cell, "is")
                text_el = ET.SubElement(inline, "t")
                text_el.text = str(value)
    ET.SubElement(worksheet, "autoFilter", ref=f"A1:{excel_col(max((len(row) for row in rows), default=1))}{max(1, len(rows))}")
    return ET.tostring(worksheet, encoding="utf-8", xml_declaration=True)


def workbook_bytes(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> bytes:
    node_rows = [["id", "name", "gender", "avatar", "note", "tags", "x", "y", "fixed"]]
    for node in nodes:
        node_rows.append([
            node.get("id", ""), node.get("name", ""), node.get("gender", "unknown"), node.get("avatar", ""),
            node.get("note", ""), ",".join(node.get("tags", [])), node.get("x", ""), node.get("y", ""), node.get("fixed", False),
        ])
    edge_rows = [["id", "source", "target", "relation", "directed", "weight", "color", "line_style", "note"]]
    for edge in edges:
        edge_rows.append([
            edge.get("id", ""), edge.get("source", ""), edge.get("target", ""), edge.get("relation", ""), edge.get("directed", False),
            edge.get("weight", 2), edge.get("color", "#64748B"), edge.get("lineStyle", "solid"), edge.get("note", ""),
        ])

    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>"""
    root_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""
    workbook_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="nodes" sheetId="1" r:id="rId1"/><sheet name="edges" sheetId="2" r:id="rId2"/></sheets>
</workbook>"""
    workbook_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""
    styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>"""
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    core_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Person Relationship Graph Studio</dc:creator><cp:lastModifiedBy>Person Relationship Graph Studio</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified></cp:coreProperties>"""
    app_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Person Relationship Graph Studio</Application></Properties>"""

    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("_rels/.rels", root_rels)
        archive.writestr("xl/workbook.xml", workbook_xml)
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        archive.writestr("xl/styles.xml", styles_xml)
        archive.writestr("xl/worksheets/sheet1.xml", sheet_xml(node_rows))
        archive.writestr("xl/worksheets/sheet2.xml", sheet_xml(edge_rows))
        archive.writestr("docProps/core.xml", core_xml)
        archive.writestr("docProps/app.xml", app_xml)
    return output.getvalue()


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    namespace = {"x": XLSX_NS}
    strings = []
    for item in root.findall("x:si", namespace):
        strings.append("".join(text.text or "" for text in item.findall(".//x:t", namespace)))
    return strings


def read_sheet_rows(archive: zipfile.ZipFile, path: str, shared_strings: list[str]) -> list[dict[str, Any]]:
    root = ET.fromstring(archive.read(path))
    namespace = {"x": XLSX_NS}
    matrix: list[list[Any]] = []
    for row in root.findall(".//x:sheetData/x:row", namespace):
        values: list[Any] = []
        for cell in row.findall("x:c", namespace):
            reference = cell.get("r", "A1")
            index = excel_col_index(reference)
            while len(values) <= index:
                values.append(None)
            cell_type = cell.get("t")
            if cell_type == "inlineStr":
                value = "".join(item.text or "" for item in cell.findall(".//x:t", namespace))
            else:
                value_el = cell.find("x:v", namespace)
                raw = value_el.text if value_el is not None else ""
                if cell_type == "s":
                    try:
                        value = shared_strings[int(raw)]
                    except (ValueError, IndexError):
                        value = raw
                elif cell_type == "b":
                    value = raw == "1"
                else:
                    try:
                        number = float(raw)
                        value = int(number) if number.is_integer() else number
                    except (ValueError, AttributeError):
                        value = raw
            values[index] = value
        matrix.append(values)
    if not matrix:
        return []
    headers = [clean_text(value) for value in matrix[0]]
    result = []
    for values in matrix[1:]:
        if not any(value not in (None, "") for value in values):
            continue
        result.append({headers[index]: values[index] if index < len(values) else None for index in range(len(headers)) if headers[index]})
    return result


def parse_excel_bytes(content: bytes) -> dict[str, list[dict[str, Any]]]:
    try:
        archive = zipfile.ZipFile(io.BytesIO(content))
    except zipfile.BadZipFile as exc:
        raise ImportFormatError("Excel 文件不是有效的 XLSX/XLSM 格式。") from exc
    with archive:
        if "xl/workbook.xml" not in archive.namelist():
            raise ImportFormatError("Excel 文件缺少工作簿信息。")
        workbook_root = ET.fromstring(archive.read("xl/workbook.xml"))
        rels_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        rel_map = {item.get("Id"): item.get("Target", "") for item in rels_root.findall(f"{{{PKG_REL_NS}}}Relationship")}
        shared_strings = read_shared_strings(archive)
        sheets: dict[str, list[dict[str, Any]]] = {}
        for sheet in workbook_root.findall(f".//{{{XLSX_NS}}}sheet"):
            name = clean_text(sheet.get("name")).lower()
            rel_id = sheet.get(f"{{{REL_NS}}}id")
            target = rel_map.get(rel_id, "")
            if not target:
                continue
            path = "xl/" + target.lstrip("/")
            path = str(Path(path).as_posix())
            if path in archive.namelist():
                sheets[name] = read_sheet_rows(archive, path, shared_strings)
        nodes = next((sheets[key] for key in ("nodes", "node", "人物", "实体") if key in sheets), [])
        edges = next((sheets[key] for key in ("edges", "edge", "关系", "links") if key in sheets), [])
        if not nodes and not edges and sheets:
            edges = next(iter(sheets.values()))
        return normalize_graph(nodes, edges)


def parse_uploaded_file(filename: str, content: bytes) -> dict[str, list[dict[str, Any]]]:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_EXTENSIONS:
        raise ImportFormatError("仅支持 JSON、CSV、XLSX、XLSM 文件。")
    if extension == "json":
        return parse_json_bytes(content)
    if extension == "csv":
        return parse_csv_bytes(content)
    return parse_excel_bytes(content)


def csv_zip_bytes(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> bytes:
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        node_text = io.StringIO(newline="")
        node_writer = csv.DictWriter(node_text, fieldnames=["id", "name", "gender", "avatar", "note", "tags", "x", "y", "fixed"])
        node_writer.writeheader()
        for node in nodes:
            row = dict(node)
            row["tags"] = ",".join(node.get("tags", []))
            node_writer.writerow({key: row.get(key, "") for key in node_writer.fieldnames})
        archive.writestr("nodes.csv", "\ufeff" + node_text.getvalue())
        edge_text = io.StringIO(newline="")
        edge_writer = csv.DictWriter(edge_text, fieldnames=["id", "source", "target", "relation", "directed", "weight", "color", "lineStyle", "note"])
        edge_writer.writeheader()
        for edge in edges:
            edge_writer.writerow({key: edge.get(key, "") for key in edge_writer.fieldnames})
        archive.writestr("edges.csv", "\ufeff" + edge_text.getvalue())
        archive.writestr("README.txt", "nodes.csv 为人物表，edges.csv 为关系表。source/target 使用人物 id。编码为 UTF-8 with BOM。\n")
    return output.getvalue()


def graphml_bytes(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> bytes:
    ns = "http://graphml.graphdrawing.org/xmlns"
    ET.register_namespace("", ns)
    graphml = ET.Element(f"{{{ns}}}graphml")
    for key_id, target, attr_name, attr_type in [
        ("name", "node", "name", "string"), ("gender", "node", "gender", "string"),
        ("avatar", "node", "avatar", "string"), ("note", "all", "note", "string"),
        ("relation", "edge", "relation", "string"), ("directed", "edge", "directed", "boolean"),
        ("weight", "edge", "weight", "double"), ("color", "edge", "color", "string"),
        ("lineStyle", "edge", "lineStyle", "string"),
    ]:
        ET.SubElement(graphml, f"{{{ns}}}key", id=key_id, **{"for": target, "attr.name": attr_name, "attr.type": attr_type})
    graph = ET.SubElement(graphml, f"{{{ns}}}graph", id="G", edgedefault="undirected")
    for node in nodes:
        element = ET.SubElement(graph, f"{{{ns}}}node", id=clean_text(node.get("id")))
        for key in ("name", "gender", "avatar", "note"):
            value = node.get(key)
            if value not in (None, ""):
                ET.SubElement(element, f"{{{ns}}}data", key=key).text = clean_text(value)
    for edge in edges:
        element = ET.SubElement(graph, f"{{{ns}}}edge", id=clean_text(edge.get("id")), source=clean_text(edge.get("source")), target=clean_text(edge.get("target")), directed="true" if edge.get("directed") else "false")
        for key in ("relation", "weight", "color", "lineStyle", "note"):
            value = edge.get(key)
            if value not in (None, ""):
                ET.SubElement(element, f"{{{ns}}}data", key=key).text = clean_text(value)
        ET.SubElement(element, f"{{{ns}}}data", key="directed").text = "true" if edge.get("directed") else "false"
    return ET.tostring(graphml, encoding="utf-8", xml_declaration=True)


def normalize_payload(payload: Any) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    graph = payload.get("graph") if isinstance(payload, dict) and isinstance(payload.get("graph"), dict) else payload
    if not isinstance(graph, dict):
        raise ImportFormatError("数据结构无效。")
    normalized = normalize_graph(graph.get("nodes", []), graph.get("edges", []))
    return normalized["nodes"], normalized["edges"]


def sample_template_data() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    return (
        [
            {"id": "p001", "name": "林澈", "gender": "male", "avatar": "", "note": "项目负责人", "tags": ["核心人物"]},
            {"id": "p002", "name": "苏晴", "gender": "female", "avatar": "", "note": "研究员", "tags": ["同事"]},
        ],
        [{"id": "r001", "source": "p001", "target": "p002", "relation": "同事", "directed": False, "weight": 3, "color": "#64748B", "lineStyle": "solid", "note": ""}],
    )


class RelationshipGraphHandler(BaseHTTPRequestHandler):
    server_version = "RelationshipGraphStudio/1.3"

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def do_GET(self) -> None:  # noqa: N802
        path = unquote(urlparse(self.path).path)
        if path == "/":
            return self.send_bytes(TEMPLATE_FILE.read_bytes(), "text/html; charset=utf-8")
        if path == "/api/avatars":
            avatars = avatar_catalog()
            counts = {
                "male": sum(item["gender"] == "male" for item in avatars),
                "female": sum(item["gender"] == "female" for item in avatars),
            }
            return self.send_json({
                "avatars": avatars,
                "counts": counts,
                "expectedPerGender": AVATAR_COUNT_PER_GENDER,
                "version": AVATAR_ASSET_VERSION,
            })
        if path.startswith("/api/template/"):
            return self.handle_template(path.rsplit("/", 1)[-1])
        if path.startswith("/static/"):
            return self.serve_static(path[len("/static/"):])
        self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def do_POST(self) -> None:  # noqa: N802
        path = unquote(urlparse(self.path).path)
        try:
            if path == "/api/import":
                return self.handle_import_file()
            if path == "/api/import-text":
                return self.handle_import_text()
            if path.startswith("/api/export/"):
                return self.handle_export(path.rsplit("/", 1)[-1])
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")
        except ImportFormatError as exc:
            self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
        except Exception as exc:  # keep UI responsive with clear error payload
            self.send_json({"ok": False, "error": f"服务器处理失败：{exc}"}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length > MAX_UPLOAD_BYTES:
            raise ImportFormatError("文件过大，单个请求不能超过 20 MB。")
        return self.rfile.read(length)

    def read_json(self) -> Any:
        body = self.read_body()
        try:
            return json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ImportFormatError(f"JSON 请求解析失败：{exc}") from exc

    def handle_import_file(self) -> None:
        content_type = self.headers.get("Content-Type", "")
        if not content_type.startswith("multipart/form-data"):
            raise ImportFormatError("上传请求必须使用 multipart/form-data。")
        body = self.read_body()
        message = BytesParser(policy=email_policy).parsebytes(
            f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8") + body
        )
        filename = ""
        content = b""
        for part in message.iter_parts():
            if part.get_param("name", header="content-disposition") == "file":
                filename = part.get_filename() or ""
                content = part.get_payload(decode=True) or b""
                break
        if not filename or not content:
            raise ImportFormatError("请选择非空文件。")
        graph = parse_uploaded_file(filename, content)
        self.send_json({"ok": True, "graph": graph, "summary": {"nodes": len(graph["nodes"]), "edges": len(graph["edges"])}})

    def handle_import_text(self) -> None:
        payload = self.read_json()
        text = clean_text(payload.get("text") if isinstance(payload, dict) else "")
        format_name = clean_text(payload.get("format") if isinstance(payload, dict) else "json", "json").lower()
        if not text:
            raise ImportFormatError("请输入要解析的数据。")
        if format_name == "json":
            graph = parse_json_bytes(text.encode("utf-8"))
        elif format_name == "csv":
            graph = parse_csv_bytes(text.encode("utf-8"))
        else:
            raise ImportFormatError("在线输入仅支持 JSON 或 CSV。")
        self.send_json({"ok": True, "graph": graph, "summary": {"nodes": len(graph["nodes"]), "edges": len(graph["edges"])}})

    def handle_export(self, format_name: str) -> None:
        nodes, edges = normalize_payload(self.read_json())
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        format_name = format_name.lower()
        if format_name == "json":
            body = json.dumps({
                "meta": {"exported_at": datetime.now(timezone.utc).isoformat(), "node_count": len(nodes), "edge_count": len(edges)},
                "nodes": nodes, "edges": edges,
            }, ensure_ascii=False, indent=2).encode("utf-8")
            return self.send_bytes(body, "application/json; charset=utf-8", f"relationship_graph_{timestamp}.json")
        if format_name == "xlsx":
            return self.send_bytes(workbook_bytes(nodes, edges), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", f"relationship_graph_{timestamp}.xlsx")
        if format_name == "csv":
            return self.send_bytes(csv_zip_bytes(nodes, edges), "application/zip", f"relationship_graph_{timestamp}_csv.zip")
        if format_name == "graphml":
            return self.send_bytes(graphml_bytes(nodes, edges), "application/graphml+xml", f"relationship_graph_{timestamp}.graphml")
        raise ImportFormatError("不支持的导出格式。")

    def handle_template(self, format_name: str) -> None:
        nodes, edges = sample_template_data()
        if format_name == "xlsx":
            return self.send_bytes(workbook_bytes(nodes, edges), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "relationship_import_template.xlsx")
        if format_name == "csv":
            buffer = io.StringIO(newline="")
            headers = ["source", "target", "relation", "source_gender", "target_gender", "directed", "weight", "color", "line_style"]
            writer = csv.DictWriter(buffer, fieldnames=headers)
            writer.writeheader()
            writer.writerow({"source": "林澈", "target": "苏晴", "relation": "同事", "source_gender": "male", "target_gender": "female", "directed": "false", "weight": 3, "color": "#64748B", "line_style": "solid"})
            return self.send_bytes(("\ufeff" + buffer.getvalue()).encode("utf-8"), "text/csv; charset=utf-8", "relationship_import_template.csv")
        self.send_error(HTTPStatus.NOT_FOUND, "Template Not Found")

    def serve_static(self, relative: str) -> None:
        requested = (STATIC_DIR / relative).resolve()
        try:
            requested.relative_to(STATIC_DIR.resolve())
        except ValueError:
            return self.send_error(HTTPStatus.FORBIDDEN, "Forbidden")
        if not requested.is_file():
            return self.send_error(HTTPStatus.NOT_FOUND, "Not Found")
        mime, _ = mimetypes.guess_type(str(requested))
        if requested.suffix.lower() == ".svg":
            mime = "image/svg+xml"
        self.send_bytes(requested.read_bytes(), mime or "application/octet-stream", cache=True)

    def send_json(self, payload: Any, status: HTTPStatus = HTTPStatus.OK) -> None:
        self.send_bytes(json.dumps(payload, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8", status=status)

    def send_bytes(self, body: bytes, content_type: str, filename: str | None = None, status: HTTPStatus = HTTPStatus.OK, cache: bool = False) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        if cache:
            self.send_header("Cache-Control", "public, max-age=86400")
        else:
            self.send_header("Cache-Control", "no-store")
        if filename:
            safe = re.sub(r"[^A-Za-z0-9._-]", "_", filename)
            self.send_header("Content-Disposition", f'attachment; filename="{safe}"')
        self.end_headers()
        self.wfile.write(body)


def run_server(host: str = "127.0.0.1", port: int = 5000, open_browser: bool = False) -> None:
    try:
        server = ThreadingHTTPServer((host, port), RelationshipGraphHandler)
    except OSError as exc:
        raise SystemExit(f"无法启动服务：{host}:{port} 可能已被占用。\n详细信息：{exc}") from exc
    url = f"http://{host}:{port}"
    print("=" * 62)
    print("人物关系图谱工作台已启动")
    print(f"访问地址：{url}")
    print("按 Ctrl+C 停止服务")
    print("=" * 62)
    if open_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已停止。")
    finally:
        server.server_close()


def main() -> None:
    parser = argparse.ArgumentParser(description="人物关系图谱工作台")
    parser.add_argument("--host", default="127.0.0.1", help="监听地址，默认 127.0.0.1")
    parser.add_argument("--port", type=int, default=5000, help="监听端口，默认 5000")
    parser.add_argument("--open-browser", action="store_true", help="启动后自动打开浏览器")
    args = parser.parse_args()
    run_server(args.host, args.port, args.open_browser)


if __name__ == "__main__":
    main()
