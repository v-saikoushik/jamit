"""Production remix engine built on FFmpeg subprocess calls."""
import os
from pathlib import Path

from fastapi import HTTPException

from services.ffmpeg_utils import (
    cleanup_file,
    ensure_directory,
    ensure_ffmpeg,
    resolve_audio_path,
    run_ffmpeg,
    sanitize_output_name,
    validate_audio_output,
)

OUTPUT_DIR = ensure_directory(Path(os.getenv("OUTPUT_DIR", "./outputs")))
DEFAULT_MP3_BITRATE = os.getenv("REMIX_MP3_BITRATE", "192k")


def create_remix(vocals_path: str, instrumentals_path: str, output_name: str) -> dict:
    """Mix the provided vocal and instrumental files into a playable MP3 remix."""
    ffmpeg_binary = ensure_ffmpeg()
    resolved_vocals = resolve_audio_path(vocals_path, "vocals")
    resolved_instrumentals = resolve_audio_path(instrumentals_path, "instrumentals")
    output_file = OUTPUT_DIR / sanitize_output_name(output_name)

    try:
        run_ffmpeg(
            _build_remix_command(
                ffmpeg_binary=ffmpeg_binary,
                vocals_path=resolved_vocals,
                instrumentals_path=resolved_instrumentals,
                output_path=output_file,
            ),
            failure_message="Failed to generate remix MP3.",
        )
        validate_audio_output(output_file)
    except HTTPException:
        cleanup_file(output_file)
        raise
    except Exception as exc:
        cleanup_file(output_file)
        raise HTTPException(status_code=500, detail=f"Unexpected remix failure: {exc}") from exc

    return {"output_path": str(output_file), "method": "ffmpeg"}


def _build_remix_command(
    ffmpeg_binary: str,
    vocals_path: Path,
    instrumentals_path: Path,
    output_path: Path,
) -> list[str]:
    """Build the FFmpeg command that normalizes input formats and mixes both tracks."""
    filter_graph = (
        "[0:a]aresample=44100,"
        "aformat=sample_fmts=fltp:channel_layouts=stereo[vocals];"
        "[1:a]aresample=44100,"
        "aformat=sample_fmts=fltp:channel_layouts=stereo[instrumentals];"
        "[vocals][instrumentals]"
        "amix=inputs=2:duration=longest:dropout_transition=2:normalize=1,"
        "loudnorm=I=-16:TP=-1.5:LRA=11[mixout]"
    )

    return [
        ffmpeg_binary,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(vocals_path),
        "-i",
        str(instrumentals_path),
        "-filter_complex",
        filter_graph,
        "-map",
        "[mixout]",
        "-vn",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-c:a",
        "libmp3lame",
        "-b:a",
        DEFAULT_MP3_BITRATE,
        str(output_path),
    ]
