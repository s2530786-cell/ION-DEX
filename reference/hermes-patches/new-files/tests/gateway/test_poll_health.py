"""Unit tests for the shared PollHealthTracker."""

from gateway.platforms.poll_health import PollHealthTracker


def test_timeout_does_not_count_as_failure():
    t = PollHealthTracker()
    for _ in range(5):
        t.record_cycle()
        t.record_timeout()
    assert t.consecutive_failures == 0
    assert t.consecutive_timeouts == 5
    assert t.backoff_delay() == 0.0
    snap = t.snapshot()
    assert snap["timeout"] == 5
    assert snap["success_rate"] == 0.0  # 0 success / 5 cycles


def test_exponential_backoff_schedule_clamps():
    t = PollHealthTracker(backoff_schedule=(2, 4, 8, 30))
    assert t.backoff_delay(1) == 2.0
    assert t.backoff_delay(2) == 4.0
    assert t.backoff_delay(3) == 8.0
    assert t.backoff_delay(4) == 30.0
    assert t.backoff_delay(99) == 30.0  # clamps to last entry
    assert t.backoff_delay(0) == 0.0


def test_failure_streak_and_recovery():
    t = PollHealthTracker()
    assert t.record_failure("network_error", "boom") == 1
    assert t.record_failure("api_error") == 2
    assert t.consecutive_failures == 2
    t.record_success()
    assert t.consecutive_failures == 0
    snap = t.snapshot()
    assert snap["network_error"] == 1
    assert snap["api_error"] == 1
    assert snap["last_error"] == "boom"


def test_unknown_failure_kind_falls_back_to_exception():
    t = PollHealthTracker()
    t.record_failure("not_a_real_kind")
    assert t.snapshot()["exception"] == 1


def test_success_rate_and_reset():
    t = PollHealthTracker()
    for _ in range(3):
        t.record_cycle()
        t.record_success()
    t.record_cycle()
    t.record_failure("network_error")
    snap = t.snapshot()
    assert snap["cycles"] == 4
    assert snap["success"] == 3
    assert snap["success_rate"] == 0.75
    t.reset_failures()
    assert t.consecutive_failures == 0


def test_empty_schedule_falls_back_to_default():
    t = PollHealthTracker(backoff_schedule=())
    assert t.backoff_delay(1) == 2.0


def test_reconnect_counter():
    t = PollHealthTracker()
    t.record_reconnect()
    t.record_reconnect()
    assert t.snapshot()["reconnect"] == 2
