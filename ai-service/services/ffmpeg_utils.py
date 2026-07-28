"""Reusable FFmpeg helpers for Jamit audio processing."""
import os
import shutil
import subprocess
import uuid
from pathlib import Path
from typing import Sequence

from fastapi import HTTPException

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads")).resolve()
FFMPEG_ENV_VARS = ("FFMPEG_PATH", "FFMPEG_BIN")


def ensure_directory(directory: Path) -> Path:
    """Create a directory when needed and return its resolved path."""
    directory.mkdir(parents=True, exist_ok=True)
    return directory.resolve()


def resolve_audio_path(file_path: str, label: str) -> Path:
    """Resolve an audio file from the provided path or the configured upload directory."""
    if not file_path or not file_path.strip():
        raise HTTPException(status_code=422, detail=f"{label} path is required.")

    candidate = Path(file_path).expanduser()
    if candidate.exists():
        return candidate.resolve()

    upload_candidate = UPLOAD_DIR / candidate.name
    if upload_candidate.exists():
        return upload_candidate.resolve()

    raise HTTPException(
        status_code=404,
        detail=f"{label} file not found: {file_path}",
    )


def sanitize_output_name(output_name: str | None, default_prefix: str = "remix") -> str:
    """Normalize the output file name so remix exports always produce an MP3 file."""
    raw_name = (output_name or "").strip()
    safe_name = Path(raw_name).name if raw_name else f"{default_prefix}-{uuid.uuid4().hex[:8]}.mp3"
    stem = Path(safe_name).stem or f"{default_prefix}-{uuid.uuid4().hex[:8]}"
    return f"{stem}.mp3"


def ensure_ffmpeg() -> str:
    """Locate FFmpeg and verify that the executable can be started successfully."""
    candidates = [os.getenv(env_name) for env_name in FFMPEG_ENV_VARS if os.getenv(env_name)]
    candidates.append(shutil.which("ffmpeg"))

    for candidate in candidates:
        if not candidate:
            continue

        try:
            completed = subprocess.run(
                [candidate, "-version"],
                check=False,
                capture_output=True,
                text=True,
            )
        except OSError:
            continue

        if completed.returncode == 0:
            return candidate

    raise HTTPException(
        status_code=500,
        detail="FFmpeg is not installed or is not available on the server PATH.",
    )


def run_ffmpeg(command: Sequence[str], failure_message: str) -> None:
    """Run an FFmpeg command and raise an HTTP error with stderr details on failure."""
    try:
        completed = subprocess.run(
            list(command),
            check=False,
            capture_output=True,
            text=True,
        )
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"{failure_message}: {exc}") from exc

    if completed.returncode != 0:
        stderr = _summarize_process_output(completed.stderr)
        raise HTTPException(
            status_code=500,
            detail={
                "message": failure_message,
                "ffmpeg_error": stderr or "FFmpeg exited with a non-zero status.",
            },
        )


def validate_audio_output(output_path: Path) -> None:
    """Confirm that FFmpeg produced a non-empty output file instead of a broken artifact."""
    if not output_path.exists():
        raise HTTPException(status_code=500, detail="FFmpeg did not create the remix output file.")

    if output_path.stat().st_size <= 1024:
        raise HTTPException(
            status_code=500,
            detail="FFmpeg created an invalid remix output file.",
        )


def cleanup_file(file_path: Path) -> None:
    """Delete a partial file when processing fails so callers never see placeholder artifacts."""
    try:
        if file_path.exists():
            file_path.unlink()
    except OSError:
        pass


def _summarize_process_output(output: str | None, max_lines: int = 12) -> str:
    """Trim noisy subprocess output to the most relevant trailing FFmpeg lines."""
    if not output:
        return ""

    lines = [line.strip() for line in output.splitlines() if line.strip()]
    if len(lines) <= max_lines:
        return "\n".join(lines)

    return "\n".join(lines[-max_lines:])
