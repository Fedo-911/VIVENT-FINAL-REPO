from __future__ import annotations


def auth_header(token: str) -> dict[str, str]:
    return {'Authorization': f'Bearer {token}'}



def test_auth_users_and_plans_smoke(client, tokens):
    response = client.get('/')
    assert response.status_code == 200

    response = client.get('/plans')
    assert response.status_code == 200
    plans = response.json()
    assert len(plans) >= 2
    plan_id = plans[0]['id']

    response = client.post(
        '/auth/register',
        json={
            'email': 'newstudent@example.com',
            'password': 'Student123!',
            'full_name': 'New Student',
            'role': 'student',
        },
    )
    assert response.status_code == 201
    new_user_id = response.json()['id']

    response = client.post(
        '/auth/login',
        json={'email': 'newstudent@example.com', 'password': 'Student123!'},
    )
    assert response.status_code == 200
    new_token = response.json()['access_token']

    response = client.get('/auth/me', headers=auth_header(new_token))
    assert response.status_code == 200
    assert response.json()['email'] == 'newstudent@example.com'

    response = client.patch(
        f'/users/{new_user_id}',
        headers=auth_header(new_token),
        json={'full_name': 'Updated Student'},
    )
    assert response.status_code == 200
    assert response.json()['full_name'] == 'Updated Student'

    response = client.get('/users', headers=auth_header(tokens['admin']))
    assert response.status_code == 200
    assert len(response.json()) >= 4

    response = client.patch(
        f'/plans/{plan_id}',
        headers=auth_header(tokens['admin']),
        json={'price': 120},
    )
    assert response.status_code == 200
    assert float(response.json()['price']) == 120.0


def test_events_admin_registration_payment_discussion_and_ads_smoke(client, tokens):
    plans_response = client.get('/plans')
    plan_id = plans_response.json()[0]['id']

    create_event = client.post(
        '/events',
        headers=auth_header(tokens['student']),
        json={
            'title': 'Testing Event',
            'description': 'Event created during smoke tests.',
            'category': 'expo',
            'start_date': '2026-06-01T10:00:00+00:00',
            'end_date': '2026-06-01T12:00:00+00:00',
            'location': 'Lahore',
            'venue_details': {'hall': 'A1'},
            'plan_id': plan_id,
            'max_participants': 25,
        },
    )
    assert create_event.status_code == 201
    event_id = create_event.json()['id']

    response = client.get('/events')
    assert response.status_code == 200
    assert response.json()['total'] >= 1

    response = client.get(f'/events/{event_id}')
    assert response.status_code == 200

    response = client.get('/admin/events/pending', headers=auth_header(tokens['admin']))
    assert response.status_code == 200

    response = client.put(f'/admin/events/{event_id}/approve', headers=auth_header(tokens['admin']))
    assert response.status_code == 200
    assert response.json()['status'] == 'approved'

    response = client.post(
        f'/events/{event_id}/register',
        headers=auth_header(tokens['business']),
        json={'role_at_event': 'participant'},
    )
    assert response.status_code == 201

    response = client.get(f'/events/{event_id}/registrations', headers=auth_header(tokens['student']))
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.post(
        '/payments/initiate',
        headers=auth_header(tokens['business']),
        json={'event_id': event_id, 'amount': 99, 'payment_method': 'card'},
    )
    assert response.status_code == 201
    payment_id = response.json()['id']
    assert payment_id

    response = client.get('/payments/user', headers=auth_header(tokens['business']))
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.get(f'/payments/event/{event_id}', headers=auth_header(tokens['student']))
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.post(
        f'/events/{event_id}/discussions',
        headers=auth_header(tokens['business']),
        json={'message': 'See you there.'},
    )
    assert response.status_code == 201

    response = client.get(f'/events/{event_id}/discussions', headers=auth_header(tokens['business']))
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.post(
        f'/events/{event_id}/ads/request',
        headers=auth_header(tokens['business']),
        json={'platforms': ['instagram', 'facebook']},
    )
    assert response.status_code == 201
    ad_id = response.json()['id']

    response = client.get('/ads/requests', headers=auth_header(tokens['admin']))
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.put(
        f'/admin/ads/{ad_id}/approve',
        headers=auth_header(tokens['admin']),
        json={'admin_notes': 'Approved'},
    )
    assert response.status_code == 200
    assert response.json()['status'] == 'approved'


def test_meetings_notifications_analytics_and_records_smoke(client, tokens):
    seeded_event_id = '66666666-6666-6666-6666-666666666666'
    student_id = '22222222-2222-2222-2222-222222222222'

    response = client.post(
        f'/events/{seeded_event_id}/register',
        headers=auth_header(tokens['student']),
        json={'role_at_event': 'participant'},
    )
    assert response.status_code == 201

    response = client.get('/notifications', headers=auth_header(tokens['student']))
    assert response.status_code == 200
    notifications = response.json()
    assert len(notifications) >= 1
    notif_id = notifications[0]['id']

    response = client.put(f'/notifications/{notif_id}/read', headers=auth_header(tokens['student']))
    assert response.status_code == 200

    response = client.get('/analytics/admin/dashboard', headers=auth_header(tokens['admin']))
    assert response.status_code == 200
    assert 'total_events_by_status' in response.json()

    response = client.get('/analytics/student/dashboard', headers=auth_header(tokens['student']))
    assert response.status_code == 200
    assert 'my_registered_events' in response.json()

    response = client.get('/analytics/business/dashboard', headers=auth_header(tokens['business']))
    assert response.status_code == 200
    assert 'my_created_events' in response.json()

    response = client.get('/records/my-events', headers=auth_header(tokens['student']))
    assert response.status_code == 200
    assert 'current_events' in response.json()

    response = client.get('/records/financial', headers=auth_header(tokens['admin']))
    assert response.status_code == 200
    assert 'payments' in response.json()


def test_negative_access_control_smoke(client, tokens):
    response = client.get('/users', headers=auth_header(tokens['student']))
    assert response.status_code == 403

    response = client.get('/notifications')
    assert response.status_code == 401

    response = client.post(
        '/auth/register',
        json={
            'email': 'student@example.com',
            'password': 'Student123!',
            'full_name': 'Student User',
            'role': 'student',
        },
    )
    assert response.status_code == 400
