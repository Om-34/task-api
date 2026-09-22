import time
import pytest

from src.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    JWTError,
)


def test_password_is_hashed_and_not_stored_in_plain_text():
    plain = "SuperSecret123"
    hashed = hash_password(plain)

    assert hashed != plain
    assert len(hashed) > 20  # bcrypt hashes are long, structured strings


def test_verify_password_accepts_correct_and_rejects_incorrect():
    plain = "SuperSecret123"
    hashed = hash_password(plain)

    assert verify_password(plain, hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_access_token_round_trip_contains_subject_and_claims():
    token = create_access_token(subject="42", extra_claims={"role": "admin"})
    payload = decode_access_token(token)

    assert payload["sub"] == "42"
    assert payload["role"] == "admin"
    assert "exp" in payload


def test_tampered_token_fails_to_decode():
    token = create_access_token(subject="1")
    tampered = token[:-2] + ("aa" if not token.endswith("aa") else "bb")

    with pytest.raises(JWTError):
        decode_access_token(tampered)
