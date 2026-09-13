#!/usr/bin/env python3
"""Inventory frontend source and locate motion mechanisms. Standard library only.

Signals are search results, including comments, not proof of runtime behavior.
Reads every supported file under src/ and records hashes, even with no signals.
"""

import argparse
import collections
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".scss", ".html", ".glsl", ".frag", ".vert"}
PATTERNS = {
    "timing": r"\b(?:duration|delay|stagger|ease|easing|transition)\s*[:=(]|cubic-bezier|transition-|animation-",
    "spring": r"\b(?:spring|stiffness|damping|bounce|mass|visualDuration)\b",
    "scroll": r"ScrollTrigger|useScroll|scrollY|scrollTop|scrollLeft|\bscrub\s*:|\bpin\s*:|[\"'](?:scroll|wheel)[\"']|onWheel|scroll-timeline|view-timeline",
    "viewport": r"IntersectionObserver|whileInView|useInView|onEnterBack|onLeaveBack",
    "pointer": r"onMouse|onPointer|whileHover|:hover|pointermove|mouseenter|mouseleave|mousemove|pointerenter|pointerleave",
    "activation": r"onClick|onDoubleClick|whileTap|:active|[\"'](?:click|dblclick)[\"']|pointerdown|mousedown|touchstart",
    "keyboard-focus": r"onKeyDown|onKeyUp|keydown|keyup|onFocus|onBlur|:focus|focus-visible|\.focus\(",
    "drag": r"\bdrag(?:ging|Constraints|Elastic|Momentum|Controls)?\b|Draggable|setPointerCapture|releasePointerCapture|pointercancel|onPan|touchmove|MouseConstraint",
    "presence-layout": r"AnimatePresence|layoutId|\blayout\b|ResizeObserver|offsetHeight|offsetWidth|height: [\"']auto|initial=|exit=",
    "navigation": r"startViewTransition|view-transition|router\.push|navigate\(|TransitionProvider|history\.(?:pushState|replaceState)|popstate",
    "text-svg": r"SplitText|SplitType|split-type|strokeDash|stroke-dash|pathLength|scrambl|MorphingSegments|TextReveal",
    "loop-frame": r"requestAnimationFrame|cancelAnimationFrame|@keyframes|\brepeat\s*:|\byoyo\s*:|\binfinite\b|setAnimationLoop|ticker\.(?:add|remove)",
    "physics": r"\blerp\b|\bvelocity\b|deltaTime|Math\.exp|Matter\.|Engine\.update|restitution|frictionAir|fixedTimeStep",
    "shader-3d": r"ShaderMaterial|WebGL|WebGPU|gl_FragColor|uniform\s|uProgress|uTime|PerspectiveCamera",
    "media": r"currentTime|timeupdate|\.play\(|\.pause\(|AudioContext|requestVideoFrameCallback|\.decode\(",
    "reduced-motion": r"prefers-reduced-motion|useReducedMotion|reducedMotion|reduced-motion",
    "lifecycle": r"\.revert\(|\.kill\(|\.dispose\(|disconnect\(|removeEventListener|clearTimeout|clearInterval|AbortController|contextSafe",
}
COMPILED = {key: re.compile(value, re.I) for key, value in PATTERNS.items()}


def git(repo, *args):
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True)
    if result.returncode:
        raise ValueError(result.stderr.strip() or "Not a readable Git repository")
    return result.stdout.rstrip("\n")


def inventory(repo):
    if not (repo / "src").is_dir():
        raise ValueError(f"No src/ directory at {repo}. Supply the Compronents repository root.")
    head = git(repo, "rev-parse", "HEAD")
    files = []
    for path in sorted((repo / "src").rglob("*")):
        if not path.is_file() or path.suffix not in EXTENSIONS or path.is_symlink():
            continue
        raw = path.read_bytes()
        lines = raw.decode("utf-8").splitlines()
        signals = {}
        for name, pattern in COMPILED.items():
            hits = [i for i, line in enumerate(lines, 1) if pattern.search(line)]
            if hits:
                signals[name] = hits
        files.append({"path": path.relative_to(repo).as_posix(), "sha256": hashlib.sha256(raw).hexdigest(), "lines": len(lines), "signals": signals})
    return {
        "schema": 1,
        "head": head,
        "working_tree_changes": git(repo, "status", "--porcelain", "--untracked-files=all", "--", "src").splitlines(),
        "scope": "All supported text source under src/. Excludes dependencies, generated builds, binaries, tests and reference captures.",
        "method": "Lexical scan of every file, not execution, semantic analysis, full manual review or accessibility certification. Signal-free wrappers can import animated code. Comments can match.",
        "extensions": sorted(EXTENSIONS),
        "patterns": PATTERNS,
        "counts": {"files": len(files), "lines": sum(f["lines"] for f in files), "by_directory": dict(collections.Counter(f["path"].split("/")[1] for f in files)), "by_signal": {key: sum(key in f["signals"] for f in files) for key in PATTERNS}},
        "files": files,
    }


def encode(data):
    """Keep one source record per line so a source change produces a small diff."""
    header = json.dumps({key: value for key, value in data.items() if key != "files"}, indent=2)
    rows = ",\n".join("    " + json.dumps(entry, separators=(",", ":")) for entry in data["files"])
    return header[:-2] + ',\n  "files": [\n' + rows + "\n  ]\n}\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", type=Path, help="Repository root containing src/")
    parser.add_argument("--output", type=Path, help="Write the JSON inventory here instead of stdout")
    parser.add_argument("--check", type=Path, help="Compare with a saved inventory, reporting added, removed and changed source")
    parser.add_argument("--family", choices=PATTERNS, help="Show evidence for one family instead of JSON")
    parser.add_argument("--path", default="", help="Filter evidence paths by substring; does not narrow the inventory")
    parser.add_argument("--context", type=int, default=1, help="Lines beside each match in evidence output, default 1")
    args = parser.parse_args()
    if args.context < 0:
        parser.error("--context must be zero or greater")
    if sum(bool(x) for x in (args.output, args.check, args.family)) > 1:
        parser.error("Choose one of --output, --check, or --family")
    try:
        repo = args.repo.resolve()
        data = inventory(repo)
        if args.check:
            old = json.loads(args.check.read_text())
            before = {f["path"]: f["sha256"] for f in old["files"]}
            after = {f["path"]: f["sha256"] for f in data["files"]}
            diff = {"added": sorted(after.keys() - before.keys()), "removed": sorted(before.keys() - after.keys()), "changed": sorted(p for p in before.keys() & after.keys() if before[p] != after[p]), "scanner_changed": old.get("patterns") != PATTERNS or old.get("extensions") != sorted(EXTENSIONS)}
            print(json.dumps(diff, indent=2))
            return int(any(diff.values()))
        if args.family:
            for entry in data["files"]:
                if args.path not in entry["path"] or args.family not in entry["signals"]:
                    continue
                lines = (repo / entry["path"]).read_text().splitlines()
                selected = set()
                for number in entry["signals"][args.family]:
                    selected.update(range(max(1, number - args.context), min(len(lines), number + args.context) + 1))
                print(f"\n{entry['path']}")
                for number in sorted(selected):
                    print(f"{number}: {lines[number - 1]}")
        else:
            output = encode(data)
            if args.output:
                args.output.write_text(output)
                print(json.dumps(data["counts"], indent=2))
            else:
                print(output, end="")
        return 0
    except (ValueError, OSError, KeyError) as error:
        print(f"inventory: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
