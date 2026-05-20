"""Audio source separation — Spleeter when available, mock copy otherwise."""
import os
import shutil
import uuid

MOCK_MODE = os.getenv("AI_MOCK_MODE", "true").lower() == "true"
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./outputs")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")


def separate_audio(file_path: str) -> dict:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    base_id = uuid.uuid4().hex[:8]

    if not os.path.exists(file_path):
        # Resolve relative paths from backend
        alt = os.path.join(UPLOAD_DIR, os.path.basename(file_path))
        if os.path.exists(alt):
            file_path = alt
        else:
            file_path = _ensure_placeholder(file_path)

    vocals_path = os.path.join(OUTPUT_DIR, f"{base_id}_vocals.mp3")
    instrumentals_path = os.path.join(OUTPUT_DIR, f"{base_id}_instrumentals.mp3")

    if MOCK_MODE:
        _mock_separate(file_path, vocals_path, instrumentals_path)
    else:
        _spleeter_separate(file_path, OUTPUT_DIR, base_id)
        vocals_path = os.path.join(OUTPUT_DIR, f"{base_id}", "vocals.wav")
        instrumentals_path = os.path.join(OUTPUT_DIR, f"{base_id}", "accompaniment.wav")

    return {
        "vocals_path": vocals_path,
        "instrumentals_path": instrumentals_path,
        "method": "mock" if MOCK_MODE else "spleeter",
    }


def _mock_separate(source: str, vocals_out: str, inst_out: str):
    """Mock: copy source to both stems (demo without ML deps)."""
    if os.path.exists(source):
        shutil.copy2(source, vocals_out)
        shutil.copy2(source, inst_out)
    else:
        placeholder = _ensure_placeholder("placeholder")
        shutil.copy2(placeholder, vocals_out)
        shutil.copy2(placeholder, inst_out)


def _spleeter_separate(file_path: str, output_dir: str, base_id: str):
    try:
        from spleeter.separator import Separator
        separator = Separator("spleeter:2stems")
        separator.separate_to_file(file_path, os.path.join(output_dir, base_id))
    except ImportError:
        raise RuntimeError("Spleeter not installed. Set AI_MOCK_MODE=true or pip install spleeter")


def _ensure_placeholder(name: str) -> str:
    path = os.path.join(UPLOAD_DIR, "sample-placeholder.mp3")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    if not os.path.exists(path):
        # Minimal silent mp3 header stub for dev
        with open(path, "wb") as f:
            f.write(b"\x00" * 128)
    return path
