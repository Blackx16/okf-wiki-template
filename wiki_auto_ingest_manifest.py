#!/usr/bin/env python3
"""Build a bounded ingest manifest for the LLM wiki daemon.

This script is intentionally deterministic and cheap. It does not call an LLM.
It scans raw/ and wiki/sources/, verifies exact provenance links, and prints a
batch/chunk plan sized for models with ~200k token context.
"""
from __future__ import annotations
from pathlib import Path
import json
import hashlib
import argparse

# Determine vault root dynamically based on script location
ROOT = Path(__file__).resolve().parent
RAW = ROOT / 'raw'
SOURCES = ROOT / 'wiki' / 'sources'

TOKEN_CONTEXT = 200_000
SAFE_INPUT_TOKENS = 110_000
TARGET_BATCH_TOKENS = 75_000
MAX_FILES_PER_BATCH = 12
CHUNK_TOKENS = 35_000
CHUNK_CHARS = CHUNK_TOKENS * 4

VALID_EXTS = {'.md', '.html', '.txt'}

def approx_tokens(text: str) -> int:
    return max(1, len(text) // 4)

def word_count(text: str) -> int:
    return max(0, len(text.split()))

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def read_text(path: Path, limit: int | None = None) -> str:
    data = path.read_text(errors='ignore')
    return data if limit is None else data[:limit]

def source_texts() -> list[tuple[Path, str]]:
    if not SOURCES.exists():
        return []
    out = []
    for p in sorted(SOURCES.glob('*.md')):
        try:
            out.append((p, read_text(p)))
        except Exception:
            pass
    return out

def chunk_plan(rel: str, chars: int, tokens: int) -> list[dict]:
    chunks = []
    if chars <= CHUNK_CHARS:
        return chunks
    start = 0
    i = 1
    while start < chars:
        end = min(chars, start + CHUNK_CHARS)
        chunks.append({
            'chunk': i,
            'char_start': start,
            'char_end': end,
            'approx_tokens': approx_tokens('x' * (end - start)),
            'instruction': f'Read {rel} chunk {i} using range extraction; write/update one source page incrementally.'
        })
        start = end
        i += 1
    return chunks

def main() -> None:
    parser = argparse.ArgumentParser(description="Wiki Auto Ingest Manifest Generator")
    parser.add_argument("--context-size", type=int, default=200000, help="Max context window size in tokens")
    args = parser.parse_args()

    token_context = args.context_size
    # Adjust dynamic scaling based on context size
    safe_input_tokens = int(token_context * 0.55)
    target_batch_tokens = int(token_context * 0.375)
    chunk_tokens = int(token_context * 0.175)

    if not RAW.exists():
        print(json.dumps({'error': 'raw/ directory not found. Run setup.py first.'}, indent=2))
        return
        
    raw_files = sorted([p for p in RAW.rglob('*') if p.is_file() and p.suffix.lower() in VALID_EXTS and '.git' not in p.parts], key=lambda p: str(p).lower())
    srcs = source_texts()

    items = []
    for p in raw_files:
        # Ignore keep files
        if p.name == '.gitkeep':
            continue
        rel = str(p.relative_to(ROOT))
        size = p.stat().st_size
        sample = read_text(p, 20_000)
        tokens = max(approx_tokens(sample), size // 4)
        linked_pages = []
        body_link_pages = []
        for sp, txt in srcs:
            if rel in txt:
                linked_pages.append(str(sp.relative_to(ROOT)))
                if '**Source:**' in txt:
                    body_link_pages.append(str(sp.relative_to(ROOT)))
        status = 'ok'
        if not linked_pages:
            status = 'new_or_disconnected'
        elif len(linked_pages) > 1:
            status = 'duplicate_processed_pages'
        elif not body_link_pages:
            status = 'missing_body_backlink'

        items.append({
            'raw': rel,
            'bytes': size,
            'approx_tokens': tokens,
            'word_count': word_count(sample),
            'model_level': 'high' if word_count(sample) > 800 else 'low',
            'sha256': sha256(p),
            'status': status,
            'linked_pages': linked_pages,
            'requires_chunking': tokens > chunk_tokens,
            'chunks': chunk_plan(rel, size, tokens),
        })

    actionable = [x for x in items if x['status'] != 'ok']

    batches = []
    current = []
    current_tokens = 0
    for item in actionable:
        cost = min(item['approx_tokens'], chunk_tokens if item['requires_chunking'] else item['approx_tokens'])
        if current and (current_tokens + cost > target_batch_tokens or len(current) >= MAX_FILES_PER_BATCH):
            batches.append({'approx_tokens': current_tokens, 'items': current})
            current = []
            current_tokens = 0
        current.append(item)
        current_tokens += cost
    if current:
        batches.append({'approx_tokens': current_tokens, 'items': current})

    print(json.dumps({
        'wiki_root': str(ROOT),
        'context_window_tokens': token_context,
        'safe_input_tokens': safe_input_tokens,
        'target_batch_tokens': target_batch_tokens,
        'chunk_tokens': chunk_tokens,
        'raw_file_count': len(raw_files),
        'source_page_count': len(srcs),
        'actionable_count': len(actionable),
        'status_counts': {s: sum(1 for x in items if x['status'] == s) for s in sorted(set(x['status'] for x in items))},
        'largest_files': [
            {
                'raw': x['raw'],
                'bytes': x['bytes'],
                'approx_tokens': x['approx_tokens'],
                'word_count': x['word_count'],
                'status': x['status'],
                'requires_chunking': x['requires_chunking'],
            }
            for x in sorted(items, key=lambda x: x['approx_tokens'], reverse=True)[:10]
        ],
        'batches': batches,
        'daemon_instruction': 'Process only one batch per cron tick. For requires_chunking=true, process one chunk at a time. If actionable_count is 0, report clean and do not commit.'
    }, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
