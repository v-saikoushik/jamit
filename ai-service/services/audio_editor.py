"""Modular FFmpeg-powered audio editing operations for Jamit."""
import math
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
DEFAULT_SAMPLE_RATE = 44100
DEFAULT_CHANNELS = 2
DEFAULT_MP3_BITRATE = os.getenv("AUDIO_EDITOR_MP3_BITRATE", "192k")


def trim_audio(input_path: str, output_name: str, start_time: float, duration: float) -> dict:
    """Trim a segment from an audio file and export it as MP3."""
    _validate_non_negative_number(start_time, "start_time")
    _validate_positive_number(duration, "duration")
    source_path = resolve_audio_path(input_path, "input")

    return _run_single_input_operation(
        source_path=source_path,
        output_name=output_name,
        operation_name="trim",
        command_builder=lambda ffmpeg_binary, output_path: [
            ffmpeg_binary,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-ss",
            str(start_time),
            "-t",
            str(duration),
            "-i",
            str(source_path),
            "-vn",
            "-ar",
            str(DEFAULT_SAMPLE_RATE),
            "-ac",
            str(DEFAULT_CHANNELS),
            "-c:a",
            "libmp3lame",
            "-b:a",
            DEFAULT_MP3_BITRATE,
            str(output_path),
        ],
    )


def merge_audio_files(input_paths: list[str], output_name: str) -> dict:
    """Concatenate one or more audio files into a single playable MP3."""
    if not input_paths:
        raise HTTPException(status_code=422, detail="input_paths must include at least one audio file.")

    ffmpeg_binary = ensure_ffmpeg()
    source_paths = [resolve_audio_path(input_path, f"input_paths[{index}]") for index, input_path in enumerate(input_paths)]
    output_path = OUTPUT_DIR / sanitize_output_name(output_name, default_prefix="merge")
    filter_graph = _build_concat_filter(len(source_paths))

    command = [ffmpeg_binary, "-hide_banner", "-loglevel", "error", "-y"]
    for source_path in source_paths:
        command.extend(["-i", str(source_path)])
    command.extend(
        [
            "-filter_complex",
            filter_graph,
            "-map",
            "[merged]",
            "-vn",
            "-ar",
            str(DEFAULT_SAMPLE_RATE),
            "-ac",
            str(DEFAULT_CHANNELS),
            "-c:a",
            "libmp3lame",
            "-b:a",
            DEFAULT_MP3_BITRATE,
            str(output_path),
        ]
    )

    try:
        run_ffmpeg(command, failure_message="Failed to merge audio files.")
        validate_audio_output(output_path)
    except HTTPException:
        cleanup_file(output_path)
        raise
    except Exception as exc:
        cleanup_file(output_path)
        raise HTTPException(status_code=500, detail=f"Unexpected merge failure: {exc}") from exc

    return {
        "output_path": str(output_path),
        "method": "ffmpeg",
        "operation": "merge",
        "input_count": len(source_paths),
    }


def apply_fade_in(input_path: str, output_name: str, duration: float) -> dict:
    """Apply a fade-in effect starting from the beginning of an audio file."""
    _validate_positive_number(duration, "duration")
    source_path = resolve_audio_path(input_path, "input")
    filter_graph = f"afade=t=in:st=0:d={duration}"

    return _run_filtered_operation(
        source_path=source_path,
        output_name=output_name,
        operation_name="fade-in",
        audio_filter=filter_graph,
        failure_message="Failed to apply fade-in effect.",
    )


def apply_fade_out(input_path: str, output_name: str, duration: float) -> dict:
    """Apply a fade-out effect to the tail of an audio file without probing duration first."""
    _validate_positive_number(duration, "duration")
    source_path = resolve_audio_path(input_path, "input")
    filter_graph = f"areverse,afade=t=in:st=0:d={duration},areverse"

    return _run_filtered_operation(
        source_path=source_path,
        output_name=output_name,
        operation_name="fade-out",
        audio_filter=filter_graph,
        failure_message="Failed to apply fade-out effect.",
    )


def change_volume(input_path: str, output_name: str, volume: float) -> dict:
    """Scale the source audio volume by the provided multiplier."""
    _validate_positive_number(volume, "volume")
    source_path = resolve_audio_path(input_path, "input")
    filter_graph = f"volume={volume}"

    return _run_filtered_operation(
        source_path=source_path,
        output_name=output_name,
        operation_name="volume",
        audio_filter=filter_graph,
        failure_message="Failed to change audio volume.",
    )


def change_speed(input_path: str, output_name: str, speed: float) -> dict:
    """Adjust audio playback speed while preserving pitch as FFmpeg allows."""
    _validate_positive_number(speed, "speed")
    source_path = resolve_audio_path(input_path, "input")
    filter_graph = _build_atempo_filter(speed)

    return _run_filtered_operation(
        source_path=source_path,
        output_name=output_name,
        operation_name="speed",
        audio_filter=filter_graph,
        failure_message="Failed to change audio speed.",
    )


def change_pitch(input_path: str, output_name: str, semitones: float) -> dict:
    """Shift audio pitch by semitones while compensating duration with atempo filters."""
    if not math.isfinite(semitones):
        raise HTTPException(status_code=422, detail="semitones must be a finite number.")

    source_path = resolve_audio_path(input_path, "input")
    pitch_ratio = 2 ** (semitones / 12.0)
    compensation_filter = _build_atempo_filter(1 / pitch_ratio)
    filter_graph = f"asetrate={DEFAULT_SAMPLE_RATE}*{pitch_ratio},aresample={DEFAULT_SAMPLE_RATE},{compensation_filter}"

    return _run_filtered_operation(
        source_path=source_path,
        output_name=output_name,
        operation_name="pitch",
        audio_filter=filter_graph,
        failure_message="Failed to change audio pitch.",
    )


def _run_filtered_operation(
    source_path: Path,
    output_name: str,
    operation_name: str,
    audio_filter: str,
    failure_message: str,
) -> dict:
    """Run a single-input FFmpeg command that applies an audio filter and exports MP3."""
    return _run_single_input_operation(
        source_path=source_path,
        output_name=output_name,
        operation_name=operation_name,
        command_builder=lambda ffmpeg_binary, output_path: [
            ffmpeg_binary,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source_path),
            "-filter:a",
            audio_filter,
            "-vn",
            "-ar",
            str(DEFAULT_SAMPLE_RATE),
            "-ac",
            str(DEFAULT_CHANNELS),
            "-c:a",
            "libmp3lame",
            "-b:a",
            DEFAULT_MP3_BITRATE,
            str(output_path),
        ],
        failure_message=failure_message,
    )


def _run_single_input_operation(
    source_path: Path,
    output_name: str,
    operation_name: str,
    command_builder,
    failure_message: str | None = None,
) -> dict:
    """Execute a single-input FFmpeg audio edit and return a consistent response payload."""
    ffmpeg_binary = ensure_ffmpeg()
    output_path = OUTPUT_DIR / sanitize_output_name(output_name, default_prefix=operation_name)
    failure_reason = failure_message or f"Failed to perform {operation_name} operation."

    try:
        run_ffmpeg(command_builder(ffmpeg_binary, output_path), failure_message=failure_reason)
        validate_audio_output(output_path)
    except HTTPException:
        cleanup_file(output_path)
        raise
    except Exception as exc:
        cleanup_file(output_path)
        raise HTTPException(status_code=500, detail=f"Unexpected {operation_name} failure: {exc}") from exc

    return {
        "output_path": str(output_path),
        "method": "ffmpeg",
        "operation": operation_name,
    }


def _build_concat_filter(input_count: int) -> str:
    """Build a concat filter that normalizes each source before sequentially merging them."""
    normalized_inputs = []
    filter_parts = []

    for index in range(input_count):
        label = f"a{index}"
        filter_parts.append(
            f"[{index}:a]aresample={DEFAULT_SAMPLE_RATE},"
            f"aformat=sample_fmts=fltp:channel_layouts=stereo[{label}]"
        )
        normalized_inputs.append(f"[{label}]")

    filter_parts.append("".join(normalized_inputs) + f"concat=n={input_count}:v=0:a=1[merged]")
    return ";".join(filter_parts)


def _build_atempo_filter(speed: float) -> str:
    """Build a valid FFmpeg atempo chain for speeds outside the single-filter range."""
    if not math.isfinite(speed) or speed <= 0:
        raise HTTPException(status_code=422, detail="speed must be a positive finite number.")

    factors = []
    remainder = speed

    while remainder > 2.0:
        factors.append(2.0)
        remainder /= 2.0

    while remainder < 0.5:
        factors.append(0.5)
        remainder /= 0.5

    factors.append(remainder)
    return ",".join(f"atempo={factor:.8f}" for factor in factors)


def _validate_non_negative_number(value: float, field_name: str) -> None:
    """Reject negative or non-finite numeric values for audio edit parameters."""
    if not math.isfinite(value) or value < 0:
        raise HTTPException(status_code=422, detail=f"{field_name} must be a non-negative finite number.")


def _validate_positive_number(value: float, field_name: str) -> None:
    """Reject zero, negative, or non-finite numeric values for audio edit parameters."""
    if not math.isfinite(value) or value <= 0:
        raise HTTPException(status_code=422, detail=f"{field_name} must be a positive finite number.")
