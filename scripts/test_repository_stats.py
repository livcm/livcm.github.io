import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from datetime import datetime, timezone

import update_repository_stats as stats


class RepositoryStatsTests(unittest.TestCase):
    def test_utc_windows_include_today_and_exclude_merges(self):
        now = datetime(2026, 10, 6, 14, 0, tzinfo=timezone.utc)
        dates = [
            ("2026-10-06T13:59:00+00:00", False),
            ("2026-10-06T20:00:00+08:00", False),
            ("2026-09-30T00:00:00+00:00", False),
            ("2026-09-29T23:59:59+00:00", False),
            ("2026-07-15T00:00:00+00:00", False),
            ("2026-07-14T23:59:59+00:00", False),
            ("2026-10-06T14:01:00+00:00", False),
            ("2026-10-06T12:00:00+00:00", True),
        ]
        counts = stats.weekly_counts([{"date": date, "merge": merge} for date, merge in dates], now)
        self.assertEqual(counts, [1] + [0] * 9 + [1, 3])

    def test_history_excludes_only_snapshot_bot_commits(self):
        rows = [
            "a" * 40 + "\x1f2026-10-06T12:00:00Z\x1fparent\x1fgithub-actions[bot]\x1f" + stats.REFRESH_MESSAGE,
            "b" * 40 + "\x1f2026-10-06T11:00:00Z\x1fone two\x1fAneko\x1fMerge content",
            "c" * 40 + "\x1f2026-10-06T10:00:00Z\x1fparent\x1fgithub-actions[bot]\x1fOther automated update",
        ]
        with patch.object(stats, "git", side_effect=["false", "\n".join(rows)]):
            commits = stats.history()
        self.assertEqual([c["sha"] for c in commits], ["b" * 40, "c" * 40])
        self.assertTrue(commits[0]["merge"])

    def test_shallow_history_is_rejected(self):
        with patch.object(stats, "git", return_value="true"):
            with self.assertRaisesRegex(RuntimeError, "Complete Git history"):
                stats.history()

    def test_star_counter_accepts_zero_and_full_counts(self):
        for text, expected in [("0", 0), ("1,234", 1234), ("unknown", None)]:
            parser = stats.StarCounter()
            parser.feed('<span id="repo-stars-counter-star" title="' + text + '"></span>')
            self.assertEqual(parser.value, expected)

    def test_failed_star_refresh_keeps_original_timestamp(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "repository_stats.json"
            original = {"value": 0, "updated": "2026-10-01T10:00:00+08:00"}
            output.write_text(json.dumps({"repository": "livcm/livcm.github.io", "stars": original}))
            commits = [{"sha": "a" * 40, "date": "2026-10-03T18:15:00Z", "merge": False}]
            with patch.object(stats, "OUTPUT", output), patch.object(stats, "history", return_value=commits), patch.object(stats, "star_count", side_effect=OSError("offline")), patch.dict(stats.os.environ, {"GITHUB_REPOSITORY": "livcm/livcm.github.io"}):
                stats.main()
            result = json.loads(output.read_text())
            self.assertEqual(result["stars"], original)
            self.assertEqual(result["commit"]["value"]["date"], "2026-10-04T02:15:00+08:00")


if __name__ == "__main__":
    unittest.main()
