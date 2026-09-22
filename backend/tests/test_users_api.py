from tests.conftest import register_user, login_user, auth_headers, make_admin


def test_normal_user_can_view_own_profile(client):
    register_user(client, email="dave@example.com")
    token = login_user(client, email="dave@example.com")

    resp = client.get("/users/me", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["email"] == "dave@example.com"


def test_normal_user_cannot_list_all_users(client):
    register_user(client, email="erin@example.com")
    token = login_user(client, email="erin@example.com")

    resp = client.get("/users", headers=auth_headers(token))
    assert resp.status_code == 403


def test_normal_user_cannot_delete_a_user(client):
    register_user(client, email="frank@example.com")
    register_user(client, email="grace@example.com")
    token = login_user(client, email="frank@example.com")

    resp = client.delete("/users/2", headers=auth_headers(token))
    assert resp.status_code == 403


def test_admin_can_list_and_delete_users(client):
    register_user(client, email="admin@example.com", password="password123")
    register_user(client, email="target@example.com", password="password123")
    make_admin("admin@example.com")

    admin_token = login_user(client, email="admin@example.com")

    list_resp = client.get("/users", headers=auth_headers(admin_token))
    assert list_resp.status_code == 200
    emails = [u["email"] for u in list_resp.json()]
    assert "admin@example.com" in emails
    assert "target@example.com" in emails

    target_id = next(u["id"] for u in list_resp.json() if u["email"] == "target@example.com")
    del_resp = client.delete(f"/users/{target_id}", headers=auth_headers(admin_token))
    assert del_resp.status_code == 204

    list_resp_after = client.get("/users", headers=auth_headers(admin_token))
    emails_after = [u["email"] for u in list_resp_after.json()]
    assert "target@example.com" not in emails_after
