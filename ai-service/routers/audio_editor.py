"""FastAPI routes for modular FFmpeg audio editing operations."""
from fastapi import APIRouter
from pydantic import BaseModel

from services.audio_editor import (
    apply_fade_in,
    apply_fade_out,
    change_pitch,
    change_speed,
    change_volume,
    merge_audio_files,
    trim_audio,
)

router = APIRouter()


class TrimRequest(BaseModel):
    """Request body for audio trimming."""
    input_path: str
    output_name: str
    start_time: float
    duration: float


class MergeRequest(BaseModel):
    """Request body for concatenating multiple audio files."""
    input_paths: list[str]
    output_name: str


class FadeRequest(BaseModel):
    """Request body for fade in and fade out operations."""
    input_path: str
    output_name: str
    duration: float


class VolumeRequest(BaseModel):
    """Request body for volume adjustments."""
    input_path: str
    output_name: str
    volume: float


class SpeedRequest(BaseModel):
    """Request body for speed adjustments."""
    input_path: str
    output_name: str
    speed: float


class PitchRequest(BaseModel):
    """Request body for pitch adjustments."""
    input_path: str
    output_name: str
    semitones: float


@router.post("/trim")
async def trim(req: TrimRequest):
    """Trim a segment from the provided audio file."""
    return trim_audio(req.input_path, req.output_name, req.start_time, req.duration)


@router.post("/merge")
async def merge(req: MergeRequest):
    """Concatenate one or more audio files in the provided order."""
    return merge_audio_files(req.input_paths, req.output_name)


@router.post("/fade-in")
async def fade_in(req: FadeRequest):
    """Apply a fade-in effect to the input file."""
    return apply_fade_in(req.input_path, req.output_name, req.duration)


@router.post("/fade-out")
async def fade_out(req: FadeRequest):
    """Apply a fade-out effect to the input file."""
    return apply_fade_out(req.input_path, req.output_name, req.duration)


@router.post("/volume")
async def volume(req: VolumeRequest):
    """Adjust the volume of the input file."""
    return change_volume(req.input_path, req.output_name, req.volume)


@router.post("/speed")
async def speed(req: SpeedRequest):
    """Adjust the playback speed of the input file."""
    return change_speed(req.input_path, req.output_name, req.speed)


@router.post("/pitch")
async def pitch(req: PitchRequest):
    """Adjust the pitch of the input file."""
    return change_pitch(req.input_path, req.output_name, req.semitones)
