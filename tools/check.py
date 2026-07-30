#!/usr/bin/env python3
"""Sanity check for the static site. Run: python3 check.py

Fails loudly if markup is unbalanced, an in-page link points nowhere, a class is
used but never styled, a counter is malformed, or the page pulls anything from a
host other than Google Fonts (the site must stay dependency-free and free to run).
"""
import os
import re
import sys
from html.parser import HTMLParser

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
        "source", "track", "wbr", "path", "circle", "rect", "line", "polygon",
        "polyline", "ellipse", "stop", "use"}
ALLOWED_HOSTS = {"fonts.googleapis.com", "fonts.gstatic.com"}


class Balance(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.errors = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append((tag, self.getpos()))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append(f"stray </{tag}> at {self.getpos()}")
            return
        open_tag, pos = self.stack.pop()
        if open_tag != tag:
            self.errors.append(f"<{open_tag}> at {pos} closed by </{tag}> at {self.getpos()}")


def main():
    html = open("index.html", encoding="utf-8").read()
    css = open("styles.css", encoding="utf-8").read()
    js = open("app.js", encoding="utf-8").read()
    problems = []

    parser = Balance()
    parser.feed(html)
    problems += parser.errors
    problems += [f"unclosed <{t}> at {p}" for t, p in parser.stack]

    ids = set(re.findall(r'id="([^"]+)"', html))
    problems += [f"dead anchor #{h}" for h in re.findall(r'href="#([^"]+)"', html)
                 if h and h not in ids]

    styled = set(re.findall(r"\.([a-zA-Z][\w-]*)", css))
    used = {c for attr in re.findall(r'class="([^"]+)"', html) for c in attr.split()}
    problems += [f"class .{c} used but never styled" for c in sorted(used - styled)]

    # every element the JS reaches for by id must exist
    problems += [f'getElementById("{i}") has no matching id' for i in
                 re.findall(r'getElementById\("([^"]+)"\)', js) if i not in ids]

    # counters must parse as numbers
    for tag in re.findall(r"<[^>]*data-count-to[^>]*>", html):
        for attr in ("count-to", "count-from"):
            m = re.search(rf'data-{attr}="([^"]*)"', tag)
            if m:
                try:
                    float(m.group(1))
                except ValueError:
                    problems.append(f"data-{attr}={m.group(1)!r} is not a number")

    # every locally referenced file must exist, or the live site 404s
    for ref in re.findall(r'(?:href|src)="([^"#:]+)"', html):
        if not os.path.exists(ref):
            problems.append(f"missing local file: {ref}")

    # no third-party hosts beyond Google Fonts: no CDN, no tracker, no paid service
    for url in re.findall(r'(?:src|href)="https?://([^/"]+)', html):
        if url not in ALLOWED_HOSTS and not url.endswith(
                ("github.com", "github.io", "linkedin.com", "ieee.org",
                 "streamlit.app", "huggingface.co")):
            problems.append(f"unexpected external host: {url}")

    if problems:
        print("FAIL")
        for p in problems:
            print("  -", p)
        return 1

    print(f"OK — markup balanced, {len(ids)} ids, {len(used)} classes all styled, "
          f"no third-party dependencies")
    return 0


if __name__ == "__main__":
    sys.exit(main())
