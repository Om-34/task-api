import os
from dotenv import load_dotenv

# Load variables from a .env file if present (never commit the real .env file)
load_dotenv()


class Settings:
    """
    Centralised application settings. All secrets/config are read from
    environment variables - nothing sensitive is hardcoded in source code.
    """

    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")

    # Comma-separated list of origins allowed to call this API from a browser
    # (e.g. "http://localhost:5173,https://app.example.com"). Defaults to the
    # typical local frontend dev ports so things work out of the box.
    CORS_ORIGINS: list = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ]

    def __init__(self) -> None:
        if not self.SECRET_KEY:
            raise ValueError(
                "SECRET_KEY environment variable must be set. "
                "Copy .env.example to .env and set a strong secret."
            )


settings = Settings()
