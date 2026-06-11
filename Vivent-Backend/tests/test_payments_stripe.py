from __future__ import annotations

from conftest import auth_header

def test_stripe_mock_payment_flow(client, tokens, fake_supabase):
    event_id = '66666666-6666-6666-6666-666666666666'
    student_id = '22222222-2222-2222-2222-222222222222'
    
    # 1. Pre-condition: Register student for event first to avoid "register before payment" validation error
    reg_res = client.post(
        f'/events/{event_id}/register',
        headers=auth_header(tokens['student']),
        json={'role_at_event': 'participant'},
    )
    assert reg_res.status_code == 201
    reg_id = reg_res.json()['id']
    
    # Assert initial payment status is "pending"
    db_reg = fake_supabase.db['event_registrations'][0]
    assert db_reg['payment_status'] == 'pending'

    # 2. Create Stripe Checkout Session
    res_session = client.post(
        '/payments/stripe/create-checkout-session',
        headers=auth_header(tokens['student']),
        json={
            'event_id': event_id,
            'success_url': 'http://localhost:3000/success',
            'cancel_url': 'http://localhost:3000/cancel'
        }
    )
    assert res_session.status_code == 201
    session_data = res_session.json()
    assert 'session_id' in session_data
    assert 'checkout_url' in session_data
    assert float(session_data['amount']) == 99.0 # default basic plan price in conftest.py is 99.0
    
    # 3. Retrieve HTML mock portal
    from urllib.parse import urlparse
    parsed = urlparse(session_data['checkout_url'])
    rel_path = parsed.path
    if parsed.query:
        rel_path += "?" + parsed.query
    
    res_portal = client.get(rel_path)
    assert res_portal.status_code == 200
    assert 'text/html' in res_portal.headers['content-type']
    assert 'Stripe Checkout Portal' in res_portal.text
    
    # 4. Trigger the simulated Stripe webhook completed event
    payload = {
        'id': 'evt_test_12345',
        'object': 'event',
        'type': 'checkout.session.completed',
        'data': {
            'object': {
                'id': session_data['session_id'],
                'amount_total': 9900,
                'currency': 'usd',
                'payment_status': 'paid',
                'metadata': {
                    'user_id': student_id,
                    'event_id': event_id,
                    'reg_id': reg_id
                }
            }
        }
    }
    
    res_webhook = client.post('/payments/stripe/webhook', json=payload)
    assert res_webhook.status_code == 200
    assert res_webhook.json()['status'] == 'success'
    
    # Confirm database changes
    payments_in_db = fake_supabase.db['payments']
    assert len(payments_in_db) == 1
    assert payments_in_db[0]['transaction_id'] == session_data['session_id']
    assert payments_in_db[0]['amount'] == 99.0
    assert payments_in_db[0]['payment_method'] == 'stripe_card'
    
    # Confirm registration payment status changed to "completed"
    assert db_reg['payment_status'] == 'completed'
    assert db_reg['payment_id'] == payments_in_db[0]['id']

    # Confirm user received a notification
    notifications_in_db = fake_supabase.db['notifications']
    # There should be at least two notifications now (one welcome, one payment confirmed)
    assert len(notifications_in_db) >= 2
    payment_notif = [n for n in notifications_in_db if 'Stripe' in n['title']]
    assert len(payment_notif) == 1
    assert payment_notif[0]['user_id'] == student_id

    # 5. Prevent double processing (webhook idempotency check)
    res_webhook_dup = client.post('/payments/stripe/webhook', json=payload)
    assert res_webhook_dup.status_code == 200
    assert res_webhook_dup.json()['status'] == 'skipped'
    # Confirm no duplicate payment was created
    assert len(fake_supabase.db['payments']) == 1

def test_stripe_session_creation_validation(client, tokens):
    event_id = '66666666-6666-6666-6666-666666666666'
    
    # Verify student is blocked from session creation if they are NOT registered
    res = client.post(
        '/payments/stripe/create-checkout-session',
        headers=auth_header(tokens['student']),
        json={'event_id': event_id}
    )
    assert res.status_code == 400
    assert 'Register for the event before making a payment' in res.json()['detail']

    # Verify unauthenticated gets blocked
    res_unauth = client.post(
        '/payments/stripe/create-checkout-session',
        json={'event_id': event_id}
    )
    assert res_unauth.status_code == 401
