#!/usr/bin/env python3
"""Audit script for Hackathon HDD (Handoff-Driven Development).

Checks:
 1. Broken markdown links in specs/
 2. Orphan markdown files not reachable from specs-map.md
 3. Status lines in spec files (Статус: / Status:)

Usage:
  python3 specs/audit.py
"""

import os
import re
import sys

SPECS_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SPECS_DIR)
MAP_FILE = os.path.join(SPECS_DIR, 'specs-map.md')

LINK_RE = re.compile(r'\]\(([^)#\s]+?\.md)\)')
STATUS_RE = re.compile(r'^(?:Статус|Status):\s*(\w[\w-]*)\s*/\s*(\w[\w-]*)', re.IGNORECASE)

def get_prose(text: str) -> str:
    """Strip code blocks and inline code so examples don't trigger link errors."""
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    text = re.sub(r'`[^`]*`', '', text)
    return text

def collect_spec_files():
    spec_files = set()
    for root, _, files in os.walk(SPECS_DIR):
        for f in files:
            if f.endswith('.md'):
                spec_files.add(os.path.realpath(os.path.join(root, f)))
    return spec_files

def extract_links(file_path: str, content: str):
    base_dir = os.path.dirname(file_path)
    links = []
    for raw_link in LINK_RE.findall(get_prose(content)):
        if raw_link.startswith(('http://', 'https://', 'mailto:')):
            continue
        if raw_link.startswith('/'):
            target = os.path.realpath(os.path.join(ROOT_DIR, raw_link.lstrip('/')))
        else:
            target = os.path.realpath(os.path.join(base_dir, raw_link))
        links.append((raw_link, target))
    return links

def main():
    if not os.path.isfile(MAP_FILE):
        print(f"❌ Root map not found: {MAP_FILE}")
        sys.exit(1)

    spec_files = collect_spec_files()
    errors = []
    warnings = []

    file_contents = {}
    for path in spec_files:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                file_contents[path] = f.read()
        except Exception as e:
            errors.append(f"Cannot read {os.path.relpath(path, ROOT_DIR)}: {e}")

    # 1. Check broken links
    file_links = {}
    for path, content in file_contents.items():
        links = extract_links(path, content)
        file_links[path] = [target for _, target in links]
        for raw, target in links:
            if not os.path.isfile(target):
                rel_src = os.path.relpath(path, ROOT_DIR)
                errors.append(f"Broken link in {rel_src} -> {raw}")

    # 2. Check orphans (reachability from specs-map.md)
    reachable = set()
    queue = [os.path.realpath(MAP_FILE)]
    while queue:
        curr = queue.pop()
        if curr in reachable or not os.path.isfile(curr):
            continue
        reachable.add(curr)
        for target in file_links.get(curr, []):
            if target not in reachable and target in spec_files:
                queue.append(target)

    orphans = spec_files - reachable
    for orphan in sorted(orphans):
        rel_orphan = os.path.relpath(orphan, ROOT_DIR)
        errors.append(f"Orphan spec (not reachable from specs-map.md): {rel_orphan}")

    # 3. Check status line
    for path, content in file_contents.items():
        first_lines = [line.strip() for line in content.splitlines()[:5] if line.strip()]
        has_status = any(STATUS_RE.search(line) for line in first_lines)
        rel_path = os.path.relpath(path, ROOT_DIR)
        if not has_status:
            warnings.append(f"Missing or invalid Status line in first 5 lines of {rel_path}")

    # Report
    print("=== HDD Specs Audit ===")
    print(f"Scanned {len(spec_files)} spec files in specs/")

    if warnings:
        for w in warnings:
            print(f"⚠️  {w}")

    if errors:
        for e in errors:
            print(f"❌ {e}")
        print(f"\nResult: FAILED ({len(errors)} error(s), {len(warnings)} warning(s))")
        sys.exit(1)
    else:
        print("\n✅ All links valid, all specs reachable, system healthy!")
        sys.exit(0)

if __name__ == '__main__':
    main()
