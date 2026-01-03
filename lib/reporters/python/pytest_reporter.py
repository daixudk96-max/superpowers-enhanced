"""
Superpowers-Fusion Pytest Reporter

Writes unified test results to .fusion/test-results.json so the TDD guard
can enforce rules across languages.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict, List


class FusionPytestReporter:
    def __init__(self) -> None:
        self.start_time = time.time()
        self.results: List[Dict[str, Any]] = []
        self.unhandled_errors: List[Dict[str, Any]] = []

    def pytest_runtest_logreport(self, report: Any) -> None:  # noqa: ANN401 - pytest hook signature
        # Skip collection and teardown phases
        if report.when not in ("setup", "call"):
            return

        status = report.outcome
        if report.when == "setup" and status == "skipped":
            mapped_status = "skip"
        elif report.when == "call":
            if status == "passed":
                mapped_status = "pass"
            elif status == "failed":
                mapped_status = "fail"
            else:
                mapped_status = "skip"
        else:
            return

        error = None
        if mapped_status == "fail":
            message = getattr(report, "longreprtext", None) or str(getattr(report, "longrepr", ""))
            error = {"message": message}

        duration_seconds = getattr(report, "duration", 0.0) or 0.0
        duration_ms = duration_seconds * 1000

        self.results.append(
            {
                "name": report.nodeid.split("::")[-1],
                "fullName": report.nodeid,
                "status": mapped_status,
                "duration": duration_ms,
                "error": error,
            }
        )

    def pytest_sessionfinish(self, session: Any, exitstatus: int) -> None:  # noqa: ANN401 - pytest hook signature
        passed = len([r for r in self.results if r["status"] == "pass"])
        failed = len([r for r in self.results if r["status"] == "fail"])
        skipped = len([r for r in self.results if r["status"] == "skip"])

        reason = self._map_reason(exitstatus, failed)
        duration_ms = int((time.time() - self.start_time) * 1000)

        report = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "duration": duration_ms,
            "summary": {
                "passed": passed,
                "failed": failed,
                "skipped": skipped,
            },
            "reason": reason,
            "tests": self.results,
        }

        if self.unhandled_errors:
            report["unhandledErrors"] = self.unhandled_errors

        output_dir = Path(session.config.rootpath) / ".fusion"
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "test-results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    @staticmethod
    def _map_reason(exitstatus: int, failed: int) -> str:
        if exitstatus == 2:
            return "interrupted"
        if exitstatus in (3, 4):
            return "unknown"
        return "failed" if failed > 0 else "passed"


def pytest_configure(config: Any) -> None:  # noqa: ANN401 - pytest hook signature
    reporter = FusionPytestReporter()
    config.pluginmanager.register(reporter, "fusion-pytest-reporter")
