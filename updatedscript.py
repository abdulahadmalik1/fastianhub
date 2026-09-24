#!/usr/bin/env python3
"""
Single-request Google Sheets extractor.
Pulls every tab's text, background/foreground colors, bold, and merged
cells in ONE Sheets API call, then writes one JSON file. No polling,
no per-tab requests, no dependencies beyond the standard library.
"""

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# ---- Configuration (only place you need to edit) ---------------------------
API_KEY = "AIzaSyChPGp69rr55E97_SJr_Ez6f95XPtbW6Ao"
SPREADSHEET_ID = "1vlTuotLw34fedME3gNQj09cZw-todVomxAiu5P1wZ6Q"
OUTPUT_PATH = Path(__file__).resolve().parent / "timetable-full.json"

# Only ask Google for what we actually use -> smaller, faster response.
FIELDS = (
    "sheets.properties(sheetId,title,sheetType,gridProperties),"
    "sheets.merges,"
    "sheets.data.rowData.values("
    "formattedValue,"
    "effectiveFormat.backgroundColor,"
    "effectiveFormat.textFormat.foregroundColor,"
    "effectiveFormat.textFormat.bold"
    ")"
)


def to_hex(color):
    if not color:
        return None
    r = round(color.get("red", 0) * 255)
    g = round(color.get("green", 0) * 255)
    b = round(color.get("blue", 0) * 255)
    return "#{:02x}{:02x}{:02x}".format(r, g, b)


def fetch_spreadsheet():
    query = urllib.parse.urlencode({
        "includeGridData": "true",
        "fields": FIELDS,
        "key": API_KEY,
    })
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}?{query}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        sys.exit(f"Google Sheets API error {e.code}: {e.read().decode('utf-8', 'replace')}")
    except urllib.error.URLError as e:
        sys.exit(f"Network error reaching Google Sheets API: {e.reason}")


def build_grid(sheet):
    rows = (sheet.get("data") or [{}])[0].get("rowData", []) or []
    grid = []
    for row in rows:
        cells = []
        for cell in row.get("values", []) or []:
            fmt = cell.get("effectiveFormat", {}) or {}
            text_fmt = fmt.get("textFormat", {}) or {}
            cells.append({
                "text": cell.get("formattedValue", ""),
                "bg": to_hex(fmt.get("backgroundColor")),
                "fg": to_hex(text_fmt.get("foregroundColor")),
                "bold": bool(text_fmt.get("bold", False)),
            })
        grid.append(cells)
    return grid


def main():
    data = fetch_spreadsheet()
    sheets = data.get("sheets") or []
    if not sheets:
        sys.exit("No tabs returned - check the spreadsheet ID and sharing settings.")

    result = {"spreadsheetId": SPREADSHEET_ID, "sheets": []}
    for sheet in sheets:
        props = sheet.get("properties", {}) or {}
        if props.get("sheetType", "GRID") != "GRID":
            continue
        grid_props = props.get("gridProperties", {}) or {}
        result["sheets"].append({
            "sheetId": props.get("sheetId"),
            "title": props.get("title"),
            "rowCount": grid_props.get("rowCount"),
            "columnCount": grid_props.get("columnCount"),
            "merges": sheet.get("merges", []),
            "grid": build_grid(sheet),
        })

    OUTPUT_PATH.write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Wrote {len(result['sheets'])} tab(s) -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()