"""
Read artist/title metadata from local audio file tags via mutagen.

Falls back to parsing "Artist - Title" out of the filename stem when tags
are missing or unreadable. Read-only against local files.
"""

from __future__ import annotations

import dataclasses
import os

from mutagen import File as MutagenFile


@dataclasses.dataclass
class TrackTags:
    artist: str | None
    title: str | None


def parse_filename_fallback(path: str) -> TrackTags:
    """
    Parse "Artist - Title" out of a filename stem.

    Examples:
        "Artist - Title.mp3"          -> Artist / Title
        "01 - Artist - Title.flac"    -> Artist / Title (leading track number dropped)
        "Some Track.wav"              -> None / "Some Track"
    """
    stem = os.path.splitext(os.path.basename(path))[0]
    stem = stem.strip()

    parts = [p.strip() for p in stem.split(" - ")]
    # Drop a leading pure-numeric track-number token, e.g. "01 - Artist - Title"
    if len(parts) >= 3 and parts[0].isdigit():
        parts = parts[1:]

    if len(parts) >= 2:
        artist = parts[0] or None
        title = " - ".join(parts[1:]).strip() or None
        return TrackTags(artist=artist, title=title)

    return TrackTags(artist=None, title=stem or None)


def _first(value):
    """Mutagen easy-tag values are typically lists; take the first entry."""
    if value is None:
        return None
    if isinstance(value, (list, tuple)):
        return str(value[0]) if value else None
    return str(value)


def read_tags(path: str) -> TrackTags:
    """
    Read artist/title from ID3 (mp3), MP4 (m4a), FLAC, or Vorbis (ogg) tags.
    Falls back to filename parsing if tags are missing/unreadable.
    """
    artist = None
    title = None

    try:
        audio = MutagenFile(path, easy=True)
    except Exception:
        audio = None

    if audio is not None and audio.tags is not None:
        tags = audio.tags
        artist = _first(tags.get("artist"))
        title = _first(tags.get("title"))

    if not artist or not title:
        fallback = parse_filename_fallback(path)
        artist = artist or fallback.artist
        title = title or fallback.title

    return TrackTags(artist=artist, title=title)
