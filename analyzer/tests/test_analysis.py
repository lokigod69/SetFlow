"""
Tests for the SETFLOW Local Library Analyzer measurement core.

No real audio files are needed: BPM and key detection are exercised against
synthesized numpy signals (a click track, and a summed-sine tonal signal).
"""

import numpy as np
import pytest

from app.analysis import (
    CAMELOT_MAP,
    CAMELOT_TO_KEY,
    analyze_buffer,
    camelot_for,
    estimate_bpm,
    estimate_key,
    key_and_mode_for_camelot,
    normalize_pitch_name,
)
from app.tags import parse_filename_fallback

SR = 22050


# ---------------------------------------------------------------------------
# (a) BPM: 120 BPM click track
# ---------------------------------------------------------------------------


def make_click_track(bpm: float, duration_sec: float, sr: int = SR) -> np.ndarray:
    """Impulse train at the given BPM (beat interval = 60/bpm seconds)."""
    interval_sec = 60.0 / bpm
    n_samples = int(duration_sec * sr)
    y = np.zeros(n_samples, dtype=np.float32)

    click_len = int(0.01 * sr)  # 10ms decaying click, more detectable than a single sample
    click_env = np.exp(-np.linspace(0, 20, click_len)).astype(np.float32)

    t = 0.0
    while t < duration_sec:
        start = int(t * sr)
        end = min(start + click_len, n_samples)
        y[start:end] += click_env[: end - start]
        t += interval_sec

    return y


def test_bpm_120_click_track():
    y = make_click_track(bpm=120.0, duration_sec=15.0, sr=SR)
    bpm = estimate_bpm(y, SR)
    assert abs(bpm - 120.0) <= 3.0, f"expected ~120 BPM, got {bpm}"


def test_bpm_normalization_range():
    # A click track at 60 BPM should be normalized (doubled) into [70, 180].
    y = make_click_track(bpm=60.0, duration_sec=15.0, sr=SR)
    bpm = estimate_bpm(y, SR)
    assert 70.0 <= bpm <= 180.0


# ---------------------------------------------------------------------------
# (b) Key: A-minor tonal signal
# ---------------------------------------------------------------------------


def make_tonal_signal(freqs_hz: list[float], duration_sec: float, sr: int = SR) -> np.ndarray:
    """Sum of sine waves at the given frequencies, with slight amplitude decay."""
    n_samples = int(duration_sec * sr)
    t = np.linspace(0, duration_sec, n_samples, endpoint=False)
    y = np.zeros(n_samples, dtype=np.float64)

    decay = np.exp(-0.05 * t)
    for freq in freqs_hz:
        y += np.sin(2 * np.pi * freq * t) * decay

    y /= np.max(np.abs(y))
    return y.astype(np.float32)


def test_key_a_minor_tonal_signal():
    # A3, C4, E4, A4 -> A minor triad across two octaves
    freqs = [220.00, 261.63, 329.63, 440.00]
    y = make_tonal_signal(freqs, duration_sec=10.0, sr=SR)

    key = estimate_key(y, SR)
    assert key.camelot in {"8A", "8B"}, f"expected 8A (or 8B tie), got {key.camelot}"


def test_analyze_buffer_end_to_end():
    # sanity check that the combined pipeline runs without error on a
    # synthesized buffer and returns plausible fields.
    freqs = [220.00, 261.63, 329.63, 440.00]
    y = make_tonal_signal(freqs, duration_sec=10.0, sr=SR)

    result = analyze_buffer(y, SR)
    assert result.bpm >= 0
    assert result.key.camelot in CAMELOT_TO_KEY
    assert result.duration_ms == pytest.approx(10_000, abs=50)


# ---------------------------------------------------------------------------
# (c) Camelot mapping unit tests (24-key round trip)
# ---------------------------------------------------------------------------


def test_camelot_map_has_24_entries():
    assert len(CAMELOT_MAP) == 24
    assert len(CAMELOT_TO_KEY) == 24


@pytest.mark.parametrize(
    "pitch,mode,expected_code",
    [
        ("A", "minor", "8A"),
        ("C", "major", "8B"),
        ("E", "minor", "9A"),
        ("G", "major", "9B"),
        ("B", "minor", "10A"),
        ("D", "major", "10B"),
        ("F#", "minor", "11A"),
        ("A", "major", "11B"),
        ("C#", "minor", "12A"),
        ("E", "major", "12B"),
        ("G#", "minor", "1A"),
        ("B", "major", "1B"),
        ("D#", "minor", "2A"),
        ("F#", "major", "2B"),
        ("A#", "minor", "3A"),
        ("C#", "major", "3B"),
        ("F", "minor", "4A"),
        ("G#", "major", "4B"),
        ("C", "minor", "5A"),
        ("D#", "major", "5B"),
        ("G", "minor", "6A"),
        ("A#", "major", "6B"),
        ("D", "minor", "7A"),
        ("F", "major", "7B"),
    ],
)
def test_camelot_for_matches_spec(pitch, mode, expected_code):
    assert camelot_for(pitch, mode) == expected_code


@pytest.mark.parametrize("code", [v for v in CAMELOT_TO_KEY.keys()])
def test_camelot_round_trip(code):
    pitch, mode = key_and_mode_for_camelot(code)
    assert camelot_for(pitch, mode) == code


def test_camelot_enharmonic_aliases():
    assert normalize_pitch_name("Db") == "C#"
    assert normalize_pitch_name("Eb") == "D#"
    assert normalize_pitch_name("Gb") == "F#"
    assert normalize_pitch_name("Ab") == "G#"
    assert normalize_pitch_name("Bb") == "A#"
    assert camelot_for("Db", "minor") == camelot_for("C#", "minor")
    assert camelot_for("Eb", "minor") == camelot_for("D#", "minor")
    assert camelot_for("Bb", "minor") == camelot_for("A#", "minor")


# ---------------------------------------------------------------------------
# (d) Filename fallback parsing
# ---------------------------------------------------------------------------


def test_filename_fallback_artist_title():
    tags = parse_filename_fallback("C:/music/Daft Punk - One More Time.mp3")
    assert tags.artist == "Daft Punk"
    assert tags.title == "One More Time"


def test_filename_fallback_with_track_number():
    tags = parse_filename_fallback("01 - Daft Punk - One More Time.flac")
    assert tags.artist == "Daft Punk"
    assert tags.title == "One More Time"


def test_filename_fallback_title_only():
    tags = parse_filename_fallback("Some Track.wav")
    assert tags.artist is None
    assert tags.title == "Some Track"


def test_filename_fallback_multi_dash_title():
    tags = parse_filename_fallback("Artist - Title - Extended Mix.mp3")
    assert tags.artist == "Artist"
    assert tags.title == "Title - Extended Mix"
