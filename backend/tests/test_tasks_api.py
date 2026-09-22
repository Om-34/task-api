from tests.conftest import register_user, login_user, auth_headers, make_admin


def create_task(client, token, title="Buy milk", **kwargs):
    payload = {"title": title, **kwargs}
    return client.post("/tasks", json=payload, headers=auth_headers(token))


def test_create_and_list_own_tasks(client):
    register_user(client, email="user1@example.com")
    token = login_user(client, email="user1@example.com")

    create_resp = create_task(client, token, title="Write report", description="Q3 summary")
    assert create_resp.status_code == 201
    body = create_resp.json()
    assert body["title"] == "Write report"
    assert body["status"] == "pending"

    list_resp = client.get("/tasks", headers=auth_headers(token))
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1


def test_task_requires_title(client):
    register_user(client, email="user2@example.com")
    token = login_user(client, email="user2@example.com")

    resp = client.post("/tasks", json={"description": "no title here"}, headers=auth_headers(token))
    assert resp.status_code == 422


def test_user_cannot_see_or_modify_others_tasks(client):
    register_user(client, email="owner@example.com")
    register_user(client, email="intruder@example.com")
    owner_token = login_user(client, email="owner@example.com")
    intruder_token = login_user(client, email="intruder@example.com")

    task = create_task(client, owner_token, title="Private task").json()

    # Intruder can't see it in their list
    list_resp = client.get("/tasks", headers=auth_headers(intruder_token))
    assert list_resp.json() == []

    # Intruder can't fetch, update or delete it directly
    get_resp = client.get(f"/tasks/{task['id']}", headers=auth_headers(intruder_token))
    assert get_resp.status_code == 403

    put_resp = client.put(
        f"/tasks/{task['id']}", json={"title": "Hacked"}, headers=auth_headers(intruder_token)
    )
    assert put_resp.status_code == 403

    del_resp = client.delete(f"/tasks/{task['id']}", headers=auth_headers(intruder_token))
    assert del_resp.status_code == 403


def test_user_can_update_and_delete_own_task(client):
    register_user(client, email="owner2@example.com")
    token = login_user(client, email="owner2@example.com")
    task = create_task(client, token, title="Old title").json()

    put_resp = client.put(
        f"/tasks/{task['id']}",
        json={"title": "New title", "status": "completed"},
        headers=auth_headers(token),
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["title"] == "New title"
    assert put_resp.json()["status"] == "completed"

    del_resp = client.delete(f"/tasks/{task['id']}", headers=auth_headers(token))
    assert del_resp.status_code == 204

    get_resp = client.get(f"/tasks/{task['id']}", headers=auth_headers(token))
    assert get_resp.status_code == 404


def test_admin_can_see_and_manage_all_tasks(client):
    register_user(client, email="admin2@example.com")
    register_user(client, email="normal@example.com")
    make_admin("admin2@example.com")

    admin_token = login_user(client, email="admin2@example.com")
    normal_token = login_user(client, email="normal@example.com")

    create_task(client, normal_token, title="Normal user's task")

    list_resp = client.get("/tasks", headers=auth_headers(admin_token))
    assert list_resp.status_code == 200
    titles = [t["title"] for t in list_resp.json()]
    assert "Normal user's task" in titles

    task_id = list_resp.json()[0]["id"]
    del_resp = client.delete(f"/tasks/{task_id}", headers=auth_headers(admin_token))
    assert del_resp.status_code == 204


def test_nonexistent_task_returns_404(client):
    register_user(client, email="user3@example.com")
    token = login_user(client, email="user3@example.com")

    resp = client.get("/tasks/9999", headers=auth_headers(token))
    assert resp.status_code == 404
