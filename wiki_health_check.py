#!/usr/bin/env python3
import os
import re
from datetime import datetime, date

vault_path = os.path.dirname(os.path.abspath(__file__))
wiki_dir = os.path.join(vault_path, 'wiki')
queries_dir = os.path.join(wiki_dir, 'queries')
report_file = os.path.join(queries_dir, 'vault-health-report.md')
summary_file = os.path.join(queries_dir, 'vault-health-summary.md')

# Configurations
THIN_WORD_COUNT = 100
STALE_DAYS_LIMIT = 90
CURRENT_DATE = date.today()

def parse_frontmatter(fm_text):
    fm = {}
    in_list = False
    current_key = None
    
    for line in fm_text.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
            
        if ':' in line and not line.startswith('-'):
            k, v = line.split(':', 1)
            k = k.strip()
            v = v.strip()
            
            if v.startswith('[') and v.endswith(']'):
                items = [x.strip().strip('"').strip("'") for x in v[1:-1].split(',')]
                fm[k] = [x for x in items if x]
            elif v.startswith('[') or v == '':
                fm[k] = []
                current_key = k
                in_list = True
            elif v.lower() in ('true', 'yes', 'on'):
                fm[k] = True
            elif v.lower() in ('false', 'no', 'off'):
                fm[k] = False
            else:
                fm[k] = v.strip('"').strip("'")
        elif in_list and line.startswith('-') and current_key:
            item = line[1:].strip().strip('"').strip("'")
            if item:
                fm[current_key].append(item)
        elif not line.startswith('-'):
            in_list = False
            current_key = None
            
    return fm

def parse_date(date_val):
    if isinstance(date_val, date):
        return date_val
    if isinstance(date_val, datetime):
        return date_val.date()
    if isinstance(date_val, str):
        try:
            return datetime.strptime(date_val.strip(), "%Y-%m-%d").date()
        except ValueError:
            pass
    return None

def main():
    print("Starting Wiki Health Check...")
    if not os.path.exists(wiki_dir):
        print(f"Error: {wiki_dir} does not exist.")
        return

    # Data collection
    all_files = {}  # slug -> file info
    all_slugs = set()
    
    # 1. First Pass: Read files and collect basic metadata
    for root, dirs, files in os.walk(wiki_dir):
        # Skip queries folder or not markdown
        if 'queries' in root:
            continue
        for file in files:
            if not file.endswith('.md'):
                continue
                
            filepath = os.path.join(root, file)
            rel_path = os.path.relpath(filepath, vault_path)
            slug = os.path.splitext(file)[0]
            all_slugs.add(slug)
            
            with open(filepath, 'r') as f:
                content = f.read()
                
            # Split frontmatter
            match = re.match(r'^---\n(.*?)\n---\n(.*)', content, re.DOTALL)
            if not match:
                all_files[slug] = {
                    'rel_path': rel_path,
                    'title': slug,
                    'type': 'unknown',
                    'frontmatter': {},
                    'body': content,
                    'word_count': len(content.split()),
                    'outgoing_links': [],
                    'errors': ['No YAML frontmatter found']
                }
                continue
                
            fm_text = match.group(1)
            body_text = match.group(2)
            
            fm = parse_frontmatter(fm_text)
                
            # Parse links in body
            body_links = re.findall(r'\[\[(.*?)\]\]', body_text)
            cleaned_body_links = []
            for link in body_links:
                target = link.split('|')[0].strip()
                if target:
                    target_slug = os.path.splitext(os.path.basename(target))[0]
                    cleaned_body_links.append(target_slug)
                    
            # Parse links in frontmatter related field
            related_links = fm.get('related', [])
            if not isinstance(related_links, list):
                related_links = []
            cleaned_related = [os.path.splitext(os.path.basename(str(r)))[0] for r in related_links if r]
            
            outgoing = list(set(cleaned_body_links + cleaned_related))
            
            all_files[slug] = {
                'rel_path': rel_path,
                'title': fm.get('title', slug),
                'type': fm.get('type', 'unknown'),
                'frontmatter': fm,
                'body': body_text,
                'word_count': len(body_text.split()),
                'outgoing_links': outgoing,
                'errors': []
            }

    # 2. Second Pass: Graph Analytics (Incoming Links)
    incoming_links = {slug: [] for slug in all_slugs}
    for slug, info in all_files.items():
        for target in info['outgoing_links']:
            if target in incoming_links:
                incoming_links[target].append(slug)

    # 3. Third Pass: Audit Notes
    thin_notes = []
    stale_notes = []
    contradiction_notes = []
    orphan_notes = []
    broken_links = []
    
    for slug, info in all_files.items():
        fm = info['frontmatter']
        body = info['body']
        
        # Check Thin
        is_thin = info['word_count'] < THIN_WORD_COUNT or not fm.get('related')
        if is_thin:
            reason = []
            if info['word_count'] < THIN_WORD_COUNT:
                reason.append(f"low word count ({info['word_count']} words)")
            if not fm.get('related'):
                reason.append("missing related metadata")
            thin_notes.append((slug, info, ", ".join(reason)))
            
        # Check Stale
        updated_date = parse_date(fm.get('updated'))
        if updated_date:
            days_stale = (CURRENT_DATE - updated_date).days
            if days_stale > STALE_DAYS_LIMIT:
                stale_notes.append((slug, info, days_stale))
        else:
            if 'No YAML frontmatter found' not in info['errors']:
                info['errors'].append("Missing or invalid updated date in frontmatter")
                stale_notes.append((slug, info, "missing date"))
            
        # Check Contradictions
        is_contested = fm.get('contested') is True
        has_contradiction_callout = '> [!contradiction]' in body
        if is_contested or has_contradiction_callout:
            reason = []
            if is_contested:
                reason.append("marked contested: true")
            if has_contradiction_callout:
                reason.append("has contradiction callout")
            contradiction_notes.append((slug, info, " & ".join(reason)))
            
        # Check Orphans
        if len(incoming_links.get(slug, [])) == 0 and info['type'] != 'query':
            orphan_notes.append((slug, info))
            
        # Check Broken Links
        for target in info['outgoing_links']:
            if target not in all_slugs and target != '':
                broken_links.append((slug, info, target))

    os.makedirs(queries_dir, exist_ok=True)
    
    # 4a. Generate Summary Report
    total_notes = len(all_slugs)
    with open(summary_file, 'w') as f:
        f.write(f"# Wiki Vault Health Summary\n\n")
        f.write(f"Generated on: `{CURRENT_DATE.strftime('%Y-%m-%d')}`\n\n")
        f.write(f"| Metric | Count | Percentage |\n")
        f.write(f"| :--- | :--- | :--- |\n")
        f.write(f"| **Total Notes** | {total_notes} | 100% |\n")
        f.write(f"| ⚠️ **Thin Notes** | {len(thin_notes)} | {len(thin_notes)/total_notes*100:.1f}% |\n")
        f.write(f"| ⏳ **Stale Notes** (> {STALE_DAYS_LIMIT} days) | {len(stale_notes)} | {len(stale_notes)/total_notes*100:.1f}% |\n")
        f.write(f"| 🛑 **Contradictions** | {len(contradiction_notes)} | {len(contradiction_notes)/total_notes*100:.1f}% |\n")
        f.write(f"| 🕸️ **Orphan Notes** | {len(orphan_notes)} | {len(orphan_notes)/total_notes*100:.1f}% |\n")
        f.write(f"| ❌ **Broken Links** | {len(broken_links)} | - |\n\n")
        f.write(f"For full action items, see [[vault-health-report]].\n")
        
    # 4b. Generate Detailed Report
    with open(report_file, 'w') as f:
        f.write(f"# Wiki Vault Detailed Health Report\n\n")
        f.write(f"Generated on: `{CURRENT_DATE.strftime('%Y-%m-%d')}`\n\n")
        f.write(f"## Recommended Action Items\n\n")
        
        if contradiction_notes:
            f.write(f"### 🛑 Resolve Contradictions\n")
            for slug, info, reason in contradiction_notes:
                f.write(f"- [[{slug}]] ({reason})\n")
                f.write(f"  *Action:* Check contradicting sources, resolve claims, and remove callout / set `contested: false`.\n")
            f.write("\n")
            
        if broken_links:
            f.write(f"### ❌ Repair Broken Links\n")
            by_file = {}
            for slug, info, target in broken_links:
                by_file.setdefault(slug, []).append(target)
            for slug, targets in by_file.items():
                targets_str = ", ".join([f"`{t}`" for t in targets])
                f.write(f"- [[{slug}]] links to non-existent: {targets_str}\n")
                f.write(f"  *Action:* Create the missing notes or correct the references in the note body / frontmatter.\n")
            f.write("\n")

        if orphan_notes:
            f.write(f"### 🕸️ Integrate Orphan Notes\n")
            for slug, info in orphan_notes:
                f.write(f"- [[{slug}]] (Type: `{info['type']}`)\n")
                f.write(f"  *Action:* Link to this note from at least one relevant concept or entity page, or add it to the index.\n")
            f.write("\n")

        if thin_notes:
            f.write(f"### ⚠️ Enrich Thin Notes\n")
            for slug, info, reason in thin_notes[:15]:
                f.write(f"- [[{slug}]] ({reason})\n")
                f.write(f"  *Action:* Synthesize more details from existing sources or add the `related` metadata block.\n")
            if len(thin_notes) > 15:
                f.write(f"- *And {len(thin_notes) - 15} more thin notes...*\n")
            f.write("\n")

        if stale_notes:
            f.write(f"### ⏳ Update Stale Notes\n")
            for slug, info, days in stale_notes[:15]:
                age_str = f"{days} days old" if isinstance(days, int) else days
                f.write(f"- [[{slug}]] (Last updated: {age_str})\n")
                f.write(f"  *Action:* Review for outdated info, check newer sources, and update the `updated` date.\n")
            if len(stale_notes) > 15:
                f.write(f"- *And {len(stale_notes) - 15} more stale notes...*\n")
            f.write("\n")
            
        syntax_errors = [s for s, info in all_files.items() if info['errors']]
        if syntax_errors:
            f.write(f"### ⚙️ Frontmatter Syntax / Parsing Issues\n")
            for slug in syntax_errors:
                errors_str = "; ".join(all_files[slug]['errors'])
                f.write(f"- [[{slug}]]: {errors_str}\n")
                f.write(f"  *Action:* Repair the YAML frontmatter block so it matches the OKF schema.\n")
            f.write("\n")

    print(f"Health check reports written to: {summary_file} and {report_file}")

if __name__ == '__main__':
    main()
