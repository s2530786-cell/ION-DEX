"""Shared long-poll / connection health tracking for platform adapters.

Different adapters use different transports (Weixin long-polls, WeCom and
Yuanbao hold websockets), but they all benefit from the same health
bookkeeping: how many cycles ran, how many succeeded, how the failures break
down by category, the current consecutive-failure streak, and an exponential
backoff delay derived from that streak.

``PollHealthTracker`` centralises that logic so each adapter records events
through one object and exposes a uniform ``snapshot()`` for the gateway status
interface — instead of every adapter hand-rolling its own counter dict.
"""

from __future__ import annotations

import time
from typing import Any, Dict, Sequence

# Default exponential backoff schedule (seconds). The 1-based consecutive
# failure count indexes into this tuple, clamping to the final (longest)
# entry so the wait caps instead of growing without bound.
DEFAULT_BACKOFF_SCHEDULE_SECONDS: tuple[int, ...] = (2, 4, 8, 30)

# Failure categories tracked separately so monitoring can distinguish a
# transient network blip from a server-side API rejection or an unexpected
# crash in the loop body.
FAILURE_KINDS: tuple[str, ...] = ("network_error", "api_error", "exception")


class PollHealthTracker:
    """Tracks poll/connection cycle outcomes and derives backoff delays.

    Timeouts are recorded but deliberately do NOT count as failures: an empty
    long-poll window (no inbound traffic) is normal and must not trigger
    backoff. Only ``record_failure`` advances the consecutive-failure streak.
    """

    def __init__(
        self,
        *,
        backoff_schedule: Sequence[int] = DEFAULT_BACKOFF_SCHEDULE_SECONDS,
    ) -> None:
        if not backoff_schedule:
            backoff_schedule = DEFAULT_BACKOFF_SCHEDULE_SECONDS
        self._backoff_schedule = tuple(backoff_schedule)
        self.consecutive_failures = 0
        self.consecutive_timeouts = 0
        self._last_error: str = ""
        self._last_event_ts: float = 0.0
        self._counts: Dict[str, int] = {
            "cycles": 0,
            "success": 0,
            "timeout": 0,
            "reconnect": 0,
        }
        for kind in FAILURE_KINDS:
            self._counts[kind] = 0

    def record_cycle(self) -> None:
        """Mark the start of a poll/receive cycle."""
        self._counts["cycles"] += 1
        self._last_event_ts = time.time()

    def record_success(self) -> None:
        """A cycle delivered cleanly; clear the failure/timeout streaks."""
        self._counts["success"] += 1
        self.consecutive_failures = 0
        self.consecutive_timeouts = 0
        self._last_event_ts = time.time()

    def record_timeout(self) -> int:
        """Record a non-failing idle timeout. Returns the new timeout streak."""
        self._counts["timeout"] += 1
        self.consecutive_timeouts += 1
        self._last_event_ts = time.time()
        return self.consecutive_timeouts

    def record_reconnect(self) -> None:
        """Record a websocket/transport reconnect attempt."""
        self._counts["reconnect"] += 1
        self._last_event_ts = time.time()

    def record_failure(self, kind: str, error: str = "") -> int:
        """Record a real failure, advancing the consecutive-failure streak.

        ``kind`` should be one of ``FAILURE_KINDS``; unknown kinds are counted
        under a catch-all so a typo never raises in a hot loop. Returns the new
        consecutive-failure count.
        """
        self.consecutive_timeouts = 0
        if kind not in self._counts:
            kind = "exception"
        self._counts[kind] += 1
        self.consecutive_failures += 1
        if error:
            self._last_error = error
        self._last_event_ts = time.time()
        return self.consecutive_failures

    def reset_failures(self) -> None:
        """Clear the consecutive-failure streak (e.g. after a deliberate pause)."""
        self.consecutive_failures = 0

    def backoff_delay(self, consecutive_failures: int | None = None) -> float:
        """Exponential backoff seconds for the given (or current) failure count.

        Indexes the schedule by the 1-based failure count, clamping to the
        final entry. Returns 0.0 when there is no active failure streak.
        """
        count = (
            self.consecutive_failures
            if consecutive_failures is None
            else consecutive_failures
        )
        if count <= 0:
            return 0.0
        index = min(count - 1, len(self._backoff_schedule) - 1)
        return float(self._backoff_schedule[index])

    def snapshot(self) -> Dict[str, Any]:
        """Return a copy of the metrics for monitoring / status output."""
        metrics: Dict[str, Any] = dict(self._counts)
        cycles = metrics.get("cycles", 0)
        success = metrics.get("success", 0)
        metrics["success_rate"] = round(success / cycles, 4) if cycles else 1.0
        metrics["consecutive_failures"] = self.consecutive_failures
        metrics["consecutive_timeouts"] = self.consecutive_timeouts
        if self._last_error:
            metrics["last_error"] = self._last_error
        if self._last_event_ts:
            metrics["last_event_age_s"] = round(time.time() - self._last_event_ts, 1)
        return metrics
