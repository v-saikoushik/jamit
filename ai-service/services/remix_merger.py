"""Merge vocals + instrumentals using pydub / ffmpeg."""
import os
import uuid

OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./outputs")
MOCK_MODE = os.getenv("AI_MOCK_MODE", "true").lower() == "true"


def create_remix(vocals_path: str, instrumentals_path: str, output_name: str) -> dict:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, output_name or f"remix-{uuid.uuid4().hex[:8]}.mp3")

    if MOCK_MODE:
        return _mock_merge(vocals_path, instrumentals_path, output_path)

    try:
        from pydub import AudioSegment
        vocals = AudioSegment.from_file(_resolve(vocals_path))
        inst = AudioSegment.from_file(_resolve(instrumentals_path))
        min_len = min(len(vocals), len(inst))
        mixed = vocals[:min_len].overlay(inst[:min_len])
        mixed.export(output_path, format="mp3")
        return {"output_path": output_path, "method": "pydub"}
    except Exception as e:
        return _mock_merge(vocals_path, instrumentals_path, output_path, error=str(e))


def _mock_merge(vocals_path: str, instrumentals_path: str, output_path: str, error: str = None):
    import shutil
    src = _resolve(vocals_path) if os.path.exists(_resolve(vocals_path)) else _resolve(instrumentals_path)
    if os.path.exists(src):
        shutil.copy2(src, output_path)
    else:
        with open(output_path, "wb") as f:
            f.write(b"\x00" * 128)
    return {"output_path": output_path, "method": "mock", "note": error}


def _resolve(path: str) -> str:
    if os.path.exists(path):
        return path
    alt = os.path.join(os.getenv("UPLOAD_DIR", "./uploads"), os.path.basename(path))
    return alt if os.path.exists(alt) else path
