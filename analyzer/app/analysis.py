"""
Core measurement logic for the SETFLOW Local Library Analyzer.

Given a path to a local audio file already on disk, this module measures:
  - BPM (tempo), normalized into a plausible DJ range (70-180)
  - Musical key, via chroma + Krumhansl-Schmuckler key-finding, expressed
    in Camelot wheel notation
  - Duration (of the full file, in milliseconds)

No network access, no downloading, no ripping. Read-only against local files.
"""

from __future__ import annotations

import dataclasses

import numpy as np
import librosa

# ---------------------------------------------------------------------------
# Analysis window: we don't need the whole file to estimate BPM/key. Skip the
# first 30s (often intros / silence / talk) and analyze up to 180s after
# that, when the file is long enough. Short files are analyzed in full.
# ---------------------------------------------------------------------------
ANALYSIS_OFFSET_SEC = 30.0
ANALYSIS_DURATION_SEC = 180.0
ANALYSIS_SR = 22050

BPM_MIN = 70.0
BPM_MAX = 180.0

# ---------------------------------------------------------------------------
# Krumhansl-Schmuckler key profiles (standard, widely published values).
# Index 0 = C, 1 = C#, ... 11 = B (pitch class).
# ---------------------------------------------------------------------------
KS_MAJOR = np.array(
    [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
)
KS_MINOR = np.array(
    [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
)

PITCH_CLASS_NAMES = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
]

# ---------------------------------------------------------------------------
# Camelot wheel mapping. Keys are (pitch_class_name, "major"/"minor").
# This is the full 12x2 mapping specified for SETFLOW.
# ---------------------------------------------------------------------------
CAMELOT_MAP: dict[tuple[str, str], str] = {
    ("A", "minor"): "8A",
    ("C", "major"): "8B",
    ("E", "minor"): "9A",
    ("G", "major"): "9B",
    ("B", "minor"): "10A",
    ("D", "major"): "10B",
    ("F#", "minor"): "11A",
    ("A", "major"): "11B",
    ("C#", "minor"): "12A",
    ("E", "major"): "12B",
    ("G#", "minor"): "1A",
    ("B", "major"): "1B",
    ("D#", "minor"): "2A",
    ("F#", "major"): "2B",
    ("A#", "minor"): "3A",
    ("C#", "major"): "3B",
    ("F", "minor"): "4A",
    ("G#", "major"): "4B",
    ("C", "minor"): "5A",
    ("D#", "major"): "5B",
    ("G", "minor"): "6A",
    ("A#", "major"): "6B",
    ("D", "minor"): "7A",
    ("F", "major"): "7B",
}

# Enharmonic aliases so lookups work regardless of sharp/flat spelling.
ENHARMONIC_ALIASES: dict[str, str] = {
    "Db": "C#",
    "Eb": "D#",
    "Gb": "F#",
    "Ab": "G#",
    "Bb": "A#",
}

# Reverse mapping: camelot code -> (pitch_class_name, mode)
CAMELOT_TO_KEY: dict[str, tuple[str, str]] = {v: k for k, v in CAMELOT_MAP.items()}


def normalize_pitch_name(name: str) -> str:
    return ENHARMONIC_ALIASES.get(name, name)


def camelot_for(pitch_class_name: str, mode: str) -> str:
    """Look up the Camelot code for a given tonic pitch class name and mode."""
    name = normalize_pitch_name(pitch_class_name)
    key = (name, mode)
    if key not in CAMELOT_MAP:
        raise ValueError(f"No Camelot mapping for {pitch_class_name} {mode}")
    return CAMELOT_MAP[key]


def key_and_mode_for_camelot(code: str) -> tuple[str, str]:
    """Inverse of camelot_for: Camelot code -> (pitch_class_name, mode)."""
    if code not in CAMELOT_TO_KEY:
        raise ValueError(f"Unknown Camelot code: {code}")
    return CAMELOT_TO_KEY[code]


@dataclasses.dataclass
class KeyResult:
    camelot: str
    tonic: str
    mode: str
    confidence: float  # correlation gap between best and second-best fit, 0..~1


@dataclasses.dataclass
class AnalysisResult:
    bpm: float
    key: KeyResult
    duration_ms: int


def _normalize_bpm(tempo: float) -> float:
    """Fold a raw tempo estimate into the plausible DJ range [70, 180]."""
    t = float(tempo)
    if t <= 0:
        return 0.0
    while t < BPM_MIN:
        t *= 2.0
    while t > BPM_MAX:
        t /= 2.0
    return round(t, 1)


def estimate_bpm(y: np.ndarray, sr: int) -> float:
    """Estimate BPM from an audio buffer, normalized into [70, 180]."""
    try:
        tempo = librosa.feature.tempo(y=y, sr=sr, aggregate=np.median)
        tempo_val = float(np.atleast_1d(tempo)[0])
    except AttributeError:
        # older librosa versions
        tempo_val, _ = librosa.beat.beat_track(y=y, sr=sr)
        tempo_val = float(tempo_val)

    if not tempo_val or tempo_val <= 0:
        # fall back to beat_track if tempo() degenerates
        tempo_val, _ = librosa.beat.beat_track(y=y, sr=sr)
        tempo_val = float(tempo_val)

    return _normalize_bpm(tempo_val)


def _key_scores(chroma_mean: np.ndarray) -> list[tuple[str, str, float]]:
    """
    Correlate a 12-bin chroma vector against all 24 major/minor KS profiles
    (each of the 12 rotations for major, and 12 for minor).

    Returns a list of (pitch_class_name, mode, correlation) sorted descending
    by correlation.
    """
    scores: list[tuple[str, str, float]] = []
    chroma_centered = chroma_mean - chroma_mean.mean()
    chroma_norm = np.linalg.norm(chroma_centered)

    for mode, profile in (("major", KS_MAJOR), ("minor", KS_MINOR)):
        profile_centered = profile - profile.mean()
        profile_norm = np.linalg.norm(profile_centered)
        for tonic_pc in range(12):
            rotated = np.roll(profile_centered, tonic_pc)
            denom = chroma_norm * profile_norm
            if denom == 0:
                corr = 0.0
            else:
                corr = float(np.dot(chroma_centered, rotated) / denom)
            scores.append((PITCH_CLASS_NAMES[tonic_pc], mode, corr))

    scores.sort(key=lambda item: item[2], reverse=True)
    return scores


def estimate_key(y: np.ndarray, sr: int) -> KeyResult:
    """Estimate musical key via chroma + Krumhansl-Schmuckler correlation."""
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = chroma.mean(axis=1)

    scores = _key_scores(chroma_mean)
    best_pc, best_mode, best_corr = scores[0]
    second_corr = scores[1][2]
    confidence = max(0.0, best_corr - second_corr)

    camelot = camelot_for(best_pc, best_mode)
    return KeyResult(camelot=camelot, tonic=best_pc, mode=best_mode, confidence=round(confidence, 4))


def load_analysis_window(path: str) -> tuple[np.ndarray, int]:
    """
    Load a mono audio buffer at ANALYSIS_SR for BPM/key analysis.

    Uses a 30s offset + 180s duration cap for files long enough to support
    it (skips intros, keeps analysis fast); shorter files are loaded in full.
    """
    full_duration = librosa.get_duration(path=path)

    if full_duration > ANALYSIS_OFFSET_SEC:
        offset = ANALYSIS_OFFSET_SEC
        duration = min(ANALYSIS_DURATION_SEC, full_duration - offset)
    else:
        offset = 0.0
        duration = full_duration

    y, sr = librosa.load(path, sr=ANALYSIS_SR, mono=True, offset=offset, duration=duration)
    return y, sr


def analyze_file(path: str) -> AnalysisResult:
    """Run the full BPM + key + duration analysis pipeline on a local file."""
    full_duration_sec = librosa.get_duration(path=path)
    y, sr = load_analysis_window(path)

    bpm = estimate_bpm(y, sr)
    key = estimate_key(y, sr)
    duration_ms = int(round(full_duration_sec * 1000))

    return AnalysisResult(bpm=bpm, key=key, duration_ms=duration_ms)


def analyze_buffer(y: np.ndarray, sr: int, duration_ms: int | None = None) -> AnalysisResult:
    """Analyze an in-memory audio buffer directly (used by tests)."""
    bpm = estimate_bpm(y, sr)
    key = estimate_key(y, sr)
    if duration_ms is None:
        duration_ms = int(round(len(y) / sr * 1000))
    return AnalysisResult(bpm=bpm, key=key, duration_ms=duration_ms)
