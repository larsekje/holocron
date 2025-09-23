#!/usr/bin/env python3
import argparse
import json
import sys
from builtins import Exception, print, set, str, isinstance, list, dict, sorted, len
from pathlib import Path

# Directory to scan for JSON files
CHAR_DIR = Path("/Users/larsegil/prog/holocron/backend/data/stoogoff/adversaries")

# Types that qualify an entry as an adversary
ADVERSARY_TYPES = {"Minion", "Rival", "Nemesis"}

# Default file for interactive labeling progress
DEFAULT_PROGRESS_FILE = Path(
    "../../Library/Application Support/JetBrains/WebStorm2025.2/scratches/named_character_labels.txt")


# ----------------------------
# Interactive labeling helpers
# ----------------------------
def _load_progress(progress_file: Path) -> dict:
    """Return dict[name] -> one of {'y','n','u'} for yes/no/uncertain."""
    progress = {}
    if progress_file.exists():
        try:
            for line in progress_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line:
                    continue
                # Accept formats: 'y<TAB>Name' or 'y Name'
                prefix, sep, name = line.partition("\t")
                if not sep:
                    parts = line.split(" ", 1)
                    if len(parts) == 2:
                        prefix, name = parts[0], parts[1]
                    else:
                        continue
                p = prefix.lower()
                if p in ("y", "n", "u"):
                    progress[name] = p
        except Exception as e:
            print(f"WARN: Could not read progress file {progress_file}: {e}", file=sys.stderr)
    return progress


def _append_progress(progress_file: Path, name: str, label: str):
    """Append a single decision to the progress file. label in {'y','n','u'}."""
    progress_file.parent.mkdir(parents=True, exist_ok=True)
    with progress_file.open("a", encoding="utf-8") as f:
        f.write(f"{label}\t{name}\n")
        f.flush()


def label_names_interactive(source_mode: str, progress_file: Path):
    """
    Prompt for each name (y/n/u), saving progress after every answer.
    Press 'q' to quit early. Already-labeled names are skipped on resume.
    Creatures (entries tagged with 'creature') are skipped automatically.
    """
    # Exclude creatures from the labeling set
    all_names = collect_names(source_mode, exclude_creatures=True)
    progress = _load_progress(progress_file)
    total = len(all_names)
    already = len(progress)
    print(
        f"Interactive labeling for {total} names from '{source_mode}'. "
        f"Already labeled: {already}. Progress file: {progress_file}",
        file=sys.stderr,
    )

    remaining = [n for n in all_names if n not in progress]
    try:
        for idx, name in enumerate(remaining, start=1):
            while True:
                ans = input(f"[{idx}/{len(remaining)}] Is '{name}' a named character? [y/n/u/q]: ").strip().lower()
                if ans in ("y", "n", "u"):
                    progress[name] = ans
                    _append_progress(progress_file, name, ans)
                    break
                elif ans == "q":
                    print("Quitting; progress saved.", file=sys.stderr)
                    return
                else:
                    print("Please answer 'y', 'n', 'u' (uncertain), or 'q' to quit.", file=sys.stderr)
    except KeyboardInterrupt:
        print("\nInterrupted; progress saved up to last answer.", file=sys.stderr)

    yes = sum(1 for v in progress.values() if v == "y")
    no = sum(1 for v in progress.values() if v == "n")
    un = sum(1 for v in progress.values() if v == "u")
    print(f"Done. yes: {yes}, no: {no}, uncertain: {un}, total recorded: {len(progress)}", file=sys.stderr)


# ----------------------------
# Data extraction helpers
# ----------------------------
def has_tag(entry, tag: str) -> bool:
    """
    Return True if the entry has the given tag (case-insensitive).
    Supports tags as a list of strings, a single string, or a comma-separated string.
    """
    tags = entry.get("tags")
    if isinstance(tags, list):
        return any(isinstance(t, str) and t.strip().lower() == tag for t in tags)
    if isinstance(tags, str):
        parts = [p.strip().lower() for p in tags.split(",")] if "," in tags else [tags.strip().lower()]
        return tag in parts
    return False


def is_character(entry):
    """Broad character filter: has a characteristics block."""
    return isinstance(entry, dict) and "name" in entry and "characteristics" in entry


def is_named_character(entry):
    """Entry has a string name, is not blacklisted, and is not a creature."""
    return (
            isinstance(entry, dict)
            and isinstance(entry.get("name"), str)
            and not has_tag(entry, "creature")
    )


def is_adversary(entry):
    """Narrow adversary filter: character whose type is Minion/Rival/Nemesis."""
    return (
            is_character(entry)
            and isinstance(entry.get("type"), str)
            and entry["type"] in ADVERSARY_TYPES
    )


def read_json(file_path: Path):
    try:
        with file_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except Exception as e:
        print(f"WARN: Skipping {file_path} due to error: {e}", file=sys.stderr)
        return None


def collect_names(mode: str, exclude_creatures: bool = False):
    """
    Collect names from JSON entries according to the mode.
    If exclude_creatures is True, any entry tagged 'creature' is skipped.
    """
    names = set()
    for fp in CHAR_DIR.rglob("*.json"):
        data = read_json(fp)
        if not isinstance(data, list):
            continue
        for entry in data:
            # Skip entries without a name
            if not (isinstance(entry, dict) and "name" in entry):
                continue

            # Exclude globally blacklisted
            name = entry["name"]
            if has_tag(entry, "creature"):
                continue

            if mode == "characters":
                if is_character(entry):
                    names.add(name)
            elif mode == "adversaries":
                if is_adversary(entry):
                    names.add(name)
            elif mode == "all-names":
                names.add(name)
            else:
                # Unknown mode: ignore
                pass
    return sorted(names, key=lambda s: (s.casefold(), s))


# ----------------------------
# CLI
# ----------------------------
def main():
    parser = argparse.ArgumentParser(description="Extract names from backend/data/custom JSON files")
    parser.add_argument(
        "mode",
        choices=["characters", "adversaries", "all-names", "label"],
        default="label",
        nargs="?",
        help=(
            "characters: entries with a characteristics block (broad: NPCs/creatures/droids). "
            "adversaries: only type in {Minion,Rival,Nemesis}. "
            "all-names: every object with a name key (includes gear/talents/etc.). "
            "label: interactive y/n/u labeling; see --source and --progress-file."
        ),
    )
    parser.add_argument(
        "-o", "--output",
        type=Path,
        help="Optional output file to write the list (UTF-8)."
    )
    parser.add_argument(
        "--source",
        choices=["characters", "adversaries", "all-names"],
        default="all-names",
        help="When mode=label, which name set to iterate over (default: all-names)."
    )
    parser.add_argument(
        "--progress-file",
        type=Path,
        default=DEFAULT_PROGRESS_FILE,
        help="When mode=label, file to append y/n/u decisions to (default: named_character_labels.txt)."
    )
    args = parser.parse_args()

    if args.mode == "label":
        label_names_interactive(args.source, args.progress_file)
        return

    names = collect_names(args.mode)

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text("\n".join(names) + "\n", encoding="utf-8")
        print(f"Wrote {len(names)} names to {args.output}")
    else:
        for n in names:
            print(n)
        print(f"\nTotal {args.mode}: {len(names)}", file=sys.stderr)


if __name__ == "__main__":
    main()