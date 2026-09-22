"""
Promote an existing user to the admin role.

Why this exists: the public /auth/register endpoint deliberately never
accepts a "role" field, so nobody can self-register as an admin. To create
the first admin account, register normally through the API and then run:

    python -m scripts.create_admin user@example.com

from the project root (with your virtualenv activated and .env configured).
"""
import sys

# Allow running as `python -m scripts.create_admin` from the project root
sys.path.append(".")

from src.database import SessionLocal  # noqa: E402
from src.models import User, RoleEnum  # noqa: E402


def promote_to_admin(email: str) -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"No user found with email: {email}")
            return
        user.role = RoleEnum.admin
        db.commit()
        print(f"User {email} is now an admin.")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.create_admin <email>")
        sys.exit(1)
    promote_to_admin(sys.argv[1])
