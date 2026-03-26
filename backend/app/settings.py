import os
from pathlib import Path


def _load_dotenv() -> None:
    """Load backend/.env variables without external dependencies."""
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


_load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError(
        "SECRET_KEY no configurada o demasiado corta. "
        "Defínela en variables de entorno o en backend/.env (mínimo 32 caracteres)."
    )