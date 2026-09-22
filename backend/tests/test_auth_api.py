from tests.conftest import register_user, login_user, auth_headers


def test_register_then_login_returns_jwt(client):
    reg_resp = register_user(client, email="alice@example.com", password="password123")
    assert reg_resp.status_code == 201
    body = reg_resp.json()
    assert body["email"] == "alice@example.com"
    assert body["role"] == "user"
    assert "hashed_password" not in body  # never leak the password hash

    login_resp = client.post(
        "/auth/login", json={"email": "alice@example.com", "password": "password123"}
    )
    assert login_resp.status_code == 200
    token_body = login_resp.json()
    assert "access_token" in token_body
    assert token_body["token_type"] == "bearer"


def test_register_duplicate_email_returns_409(client):
    register_user(client, email="bob@example.com")
    dup_resp = register_user(client, email="bob@example.com")
    assert dup_resp.status_code == 409


def test_login_wrong_password_returns_401(client):
    register_user(client, email="carol@example.com", password="password123")
    resp = client.post(
        "/auth/login", json={"email": "carol@example.com", "password": "wrong-pass"}
    )
    assert resp.status_code == 401


def test_register_rejects_invalid_email_and_short_password(client):
    resp = client.post("/auth/register", json={"email": "not-an-email", "password": "short"})
    assert resp.status_code == 422


def test_protected_route_requires_token(client):
    resp = client.get("/users/me")
    assert resp.status_code == 401


def test_protected_route_rejects_invalid_token(client):
    resp = client.get("/users/me", headers=auth_headers("this.is.not.valid"))
    assert resp.status_code == 401
