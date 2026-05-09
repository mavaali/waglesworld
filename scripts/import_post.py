#!/usr/bin/env python3
"""Import a markdown blog post + local images into Sanity as a draft.

Usage:
    SANITY_TOKEN=xxx python3 scripts/import_post.py <folder> [options]

Conventions:
    - Folder contains exactly one *.md file (or pass --md).
    - Inline images are referenced as ./image.png (relative to the markdown).
    - First H1 becomes the post title.
    - Slug is derived from the title (kebab-case) unless --slug is passed.
    - First inline image becomes mainImage unless --main-image is passed.
    - Mermaid code blocks are rendered to PNG via mmdc and inlined.

Re-running with the same slug replaces the existing draft.
"""
import argparse
import datetime
import glob
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

PROJECT = "3xigt9u7"
DATASET = "production"
API = f"https://{PROJECT}.api.sanity.io/v2024-01-01"


def slugify(title: str) -> str:
    s = title.lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s).strip("-")
    return s[:80]


def render_mermaid(source: str, out_path: Path) -> None:
    src_path = out_path.with_suffix(".mmd")
    src_path.write_text(source)
    cfg = out_path.parent / ".puppeteer.json"
    cfg.write_text('{"args":["--no-sandbox"]}')
    cmd = [
        "npx", "-y", "-p", "@mermaid-js/mermaid-cli",
        "mmdc", "-i", str(src_path), "-o", str(out_path),
        "-w", "1400", "-b", "white", "-p", str(cfg),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"mermaid render failed:\n{r.stderr}")
    src_path.unlink(missing_ok=True)
    cfg.unlink(missing_ok=True)


def upload_image(path: Path, token: str) -> tuple[str, str]:
    req = urllib.request.Request(
        f"{API}/assets/images/{DATASET}?filename={path.name}",
        data=path.read_bytes(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "image/png"},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        doc = json.load(r)["document"]
    return doc["_id"], doc["url"]


def create_draft(doc: dict, token: str) -> dict:
    req = urllib.request.Request(
        f"{API}/data/mutate/{DATASET}",
        data=json.dumps({"mutations": [{"createOrReplace": doc}]}).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("folder", nargs="?", default=".", help="folder containing the markdown + images")
    p.add_argument("--md", help="explicit markdown filename (default: only *.md in folder)")
    p.add_argument("--slug")
    p.add_argument("--published-at", help="ISO datetime (default: now UTC)")
    p.add_argument("--main-image", help="filename to use as mainImage (default: first inline image)")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    folder = Path(args.folder).resolve()
    if not folder.is_dir():
        sys.exit(f"not a directory: {folder}")

    if args.md:
        md_path = folder / args.md
    else:
        mds = sorted(glob.glob(str(folder / "*.md")))
        if len(mds) != 1:
            sys.exit(f"expected exactly one *.md in {folder}, found {len(mds)}")
        md_path = Path(mds[0])

    src = md_path.read_text()
    lines = src.splitlines()
    if not lines or not lines[0].startswith("# "):
        sys.exit("first line must be an H1 (# Title)")
    title = lines[0][2:].strip()
    body = "\n".join(lines[1:]).lstrip("\n")
    slug = args.slug or slugify(title)

    # Collect inline image refs in order of appearance
    img_refs = re.findall(r"!\[[^\]]*\]\(\.\/([^)]+)\)", body)
    seen = set()
    img_files = []
    for f in img_refs:
        if f not in seen:
            seen.add(f)
            img_files.append(f)
    for f in img_files:
        if not (folder / f).exists():
            sys.exit(f"missing image: {folder / f}")

    # Render mermaid blocks → assign synthetic filenames
    mermaid_blocks = re.findall(r"```mermaid\n(.*?)\n```", body, re.DOTALL)
    mermaid_files = []
    for i, src_block in enumerate(mermaid_blocks, start=1):
        name = f"_mermaid_{i:02d}.png"
        out = folder / name
        if not args.dry_run:
            print(f"rendering mermaid #{i} → {name}")
            render_mermaid(src_block, out)
        mermaid_files.append(name)

    main_image_file = args.main_image or (img_files[0] if img_files else None)
    if main_image_file and main_image_file not in img_files + mermaid_files:
        sys.exit(f"--main-image {main_image_file} not among uploaded images")

    all_images = img_files + mermaid_files
    print(f"\nTitle:       {title}")
    print(f"Slug:        {slug}")
    print(f"Inline imgs: {img_files}")
    print(f"Mermaid:     {mermaid_files}")
    print(f"mainImage:   {main_image_file}")

    if args.dry_run:
        # Show what the body would look like with placeholder URLs
        rewritten = body
        for f in img_files:
            rewritten = rewritten.replace(f"./{f}", f"<<CDN:{f}>>")
        rewritten = re.sub(
            r"```mermaid\n.*?\n```",
            lambda m: f"![mermaid diagram](<<CDN:{mermaid_files.pop(0)}>>)" if mermaid_files else m.group(0),
            rewritten,
            flags=re.DOTALL,
        )
        out_path = folder / ".import-preview.md"
        out_path.write_text(f"# {title}\n\n{rewritten}")
        print(f"\ndry-run: rewritten preview → {out_path}")
        return

    token = os.environ.get("SANITY_TOKEN")
    if not token:
        sys.exit("SANITY_TOKEN env var required")

    # Upload everything
    asset_map: dict[str, tuple[str, str]] = {}
    for f in all_images:
        path = folder / f
        print(f"uploading {f} ...")
        asset_id, url = upload_image(path, token)
        asset_map[f] = (asset_id, url)

    # Rewrite body: image refs
    def repl(m: re.Match) -> str:
        alt, fname = m.group(1), m.group(2)
        return f"![{alt}]({asset_map[fname][1]})"
    new_body = re.sub(r"!\[([^\]]*)\]\(\.\/([^)]+)\)", repl, body)

    # Rewrite body: mermaid blocks → image refs
    mermaid_iter = iter(mermaid_files)
    def mermaid_repl(_):
        f = next(mermaid_iter)
        return f"![diagram]({asset_map[f][1]})"
    new_body = re.sub(r"```mermaid\n.*?\n```", mermaid_repl, new_body, flags=re.DOTALL)

    word_count = len(re.findall(r"\S+", new_body))
    reading_time = max(1, round(word_count / 220))
    published_at = args.published_at or datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ")

    doc = {
        "_id": f"drafts.{slug}",
        "_type": "post",
        "title": title,
        "slug": {"_type": "slug", "current": slug},
        "publishedAt": published_at,
        "estimatedReadingTime": reading_time,
        "body": new_body,
    }
    if main_image_file:
        doc["mainImage"] = {
            "_type": "image",
            "asset": {"_type": "reference", "_ref": asset_map[main_image_file][0]},
        }

    resp = create_draft(doc, token)
    print(f"\n{json.dumps(resp, indent=2)}")
    print(f"\nWords: {word_count}  Reading time: {reading_time} min")
    print(f"Studio: https://waglesworld.sanity.studio/structure/post;drafts.{slug}")

    # Clean up rendered mermaid pngs (regenerated from source on next run)
    for f in mermaid_files:
        (folder / f).unlink(missing_ok=True)


if __name__ == "__main__":
    main()
