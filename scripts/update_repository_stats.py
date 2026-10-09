"""Generate public statistics for Jekyll without browser-side GitHub requests."""

import json
import os
from pathlib import Path
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_data" / "repository_stats.json"
REFRESH_MESSAGE = "chore: refresh repository statistics"
DISPLAY_ZONE = timezone(timedelta(hours=8))


class StarCounter(HTMLParser):
    value = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id") == "repo-stars-counter-star":
            count = attrs.get("title", "").replace(",", "")
            if count.isascii() and count.isdigit():
                self.value = int(count)


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def history():
    if git("rev-parse", "--is-shallow-repository") == "true":
        raise RuntimeError("Complete Git history is required; use fetch-depth: 0.")
    rows = git("log", "--format=%H%x1f%cI%x1f%P%x1f%an%x1f%s").splitlines()
    commits = []
    for row in rows:
        sha, date, parents, author, subject = row.split("\x1f", 4)
        # Updating a data snapshot must not become the site's latest content update.
        if author == "github-actions[bot]" and subject == REFRESH_MESSAGE:
            continue
        commits.append({"sha": sha, "date": date, "merge": len(parents.split()) > 1})
    if not commits:
        raise RuntimeError("No content commits found.")
    return commits


def weekly_counts(commits, now):
    # Twelve adjacent UTC calendar windows, including today in the latest seven days.
    end = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    start = end - timedelta(weeks=12)
    counts = [0] * 12
    for commit in commits:
        when = datetime.fromisoformat(commit["date"]).astimezone(timezone.utc)
        if not commit["merge"] and start <= when <= now:
            counts[(when - start).days // 7] += 1
    return counts


def star_count(repository):
    headers = {"User-Agent": "Aneko-repository-statistics", "Accept": "application/vnd.github+json"}
    token = os.environ.get("GH_TOKEN")
    if token:
        headers["Authorization"] = "Bearer " + token
    for attempt in range(3):
        try:
            request = Request("https://api.github.com/repos/" + repository, headers=headers)
            with urlopen(request, timeout=15) as response:
                count = json.load(response)["stargazers_count"]
            if type(count) is not int or count < 0:
                raise ValueError("Invalid star count")
            return count
        except Exception:
            if attempt == 2:
                # Also support local regeneration when the anonymous API is limited.
                request = Request("https://github.com/" + repository, headers={"User-Agent": headers["User-Agent"]})
                with urlopen(request, timeout=15) as response:
                    parser = StarCounter()
                    parser.feed(response.read().decode("utf-8"))
                if parser.value is None:
                    raise RuntimeError("Public repository star count unavailable") from None
                return parser.value
            time.sleep(2)


def main():
    repository = os.environ.get("GITHUB_REPOSITORY", "Aneko-QhJ/Aneko-QhJ.github.io")
    now = datetime.now(timezone.utc)
    updated = now.astimezone(DISPLAY_ZONE).isoformat(timespec="seconds")
    previous = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {}
    commits = history()
    try:
        stars = {"value": star_count(repository), "updated": updated}
    except Exception:
        stars = previous.get("stars") if previous.get("repository") == repository else None
        if not stars or type(stars.get("value")) is not int or stars["value"] < 0:
            raise RuntimeError("Star count unavailable and no valid snapshot exists.") from None
        print("Star refresh failed; retaining the previous value and timestamp.", file=sys.stderr)
    data = {
        "repository": repository,
        "generated_at": updated,
        "stars": stars,
        "commit": {"value": {"sha": commits[0]["sha"], "date": datetime.fromisoformat(commits[0]["date"]).astimezone(DISPLAY_ZONE).isoformat()}, "updated": updated},
        "activity": {"value": weekly_counts(commits, now), "updated": updated},
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print("Updated repository statistics for " + repository)


if __name__ == "__main__":
    main()
