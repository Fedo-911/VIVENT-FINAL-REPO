from __future__ import annotations

from conftest import auth_header

def test_analytics_cache_flow(client, tokens, fake_supabase):
    # 1. Trigger dynamic generation of analytics cache
    # Verify that admin dashboard works and populates the cache
    res = client.get('/analytics/admin/dashboard', headers=auth_header(tokens['admin']))
    assert res.status_code == 200
    assert 'total_events_by_status' in res.json()
    assert float(res.json()['total_revenue']) == 0.0 # Initial state
    
    # Assert a record is written inside `analytics_cache` table
    cache_records = fake_supabase.db['analytics_cache']
    assert len(cache_records) == 1
    assert cache_records[0]['metric_name'] == 'admin_dashboard'
    
    # 2. Modify cached value in mock database to check if we read from cache
    fake_val = {
        'total_events_by_status': {'completed': 99},
        'total_events_by_category': {'food': 50},
        'total_revenue': 12345.67,
        'participation_per_event': [],
        'chart_data': {'events_created': [], 'registrations': [], 'revenue': []}
    }
    cache_records[0]['value'] = fake_val
    
    # Call dashboard endpoint without force_refresh (default: False)
    res_cached = client.get('/analytics/admin/dashboard', headers=auth_header(tokens['admin']))
    assert res_cached.status_code == 200
    assert res_cached.json()['total_revenue'] == 12345.67
    assert res_cached.json()['total_events_by_status'] == {'completed': 99}
    
    # 3. Request with force_refresh=True to override cache and recalculate live stats
    res_forced = client.get('/analytics/admin/dashboard?force_refresh=True', headers=auth_header(tokens['admin']))
    assert res_forced.status_code == 200
    # Recalculated value should overwrite fake_val and be back to 0.0
    assert float(res_forced.json()['total_revenue']) == 0.0
    assert cache_records[0]['value']['total_revenue'] == 0.0
    
    # 4. Trigger cache refresh manually via POST /analytics/admin/dashboard/refresh
    cache_records[0]['value']['total_revenue'] = 9999.0
    res_refresh = client.post('/analytics/admin/dashboard/refresh', headers=auth_header(tokens['admin']))
    assert res_refresh.status_code == 200
    # Refresh forces calculation and updates cache back to 0.0
    assert float(res_refresh.json()['total_revenue']) == 0.0
    assert cache_records[0]['value']['total_revenue'] == 0.0

def test_analytics_cache_access_control(client, tokens):
    # Verify student is forbidden
    res = client.get('/analytics/admin/dashboard', headers=auth_header(tokens['student']))
    assert res.status_code == 403
    
    res_ref = client.post('/analytics/admin/dashboard/refresh', headers=auth_header(tokens['student']))
    assert res_ref.status_code == 403

    # Verify unauthenticated gets 401
    res_unauth = client.get('/analytics/admin/dashboard')
    assert res_unauth.status_code == 401


def test_analytics_cache_slicing(client, tokens):
    # Retrieve default (days=7) dashboard
    res_default = client.get('/analytics/admin/dashboard', headers=auth_header(tokens['admin']))
    assert res_default.status_code == 200
    default_data = res_default.json()
    assert len(default_data['chart_data']['events_created']) == 7
    assert len(default_data['chart_data']['registrations']) == 7
    assert len(default_data['chart_data']['revenue']) == 7

    # Retrieve explicit days=30 dashboard
    res_30 = client.get('/analytics/admin/dashboard?days=30', headers=auth_header(tokens['admin']))
    assert res_30.status_code == 200
    data_30 = res_30.json()
    assert len(data_30['chart_data']['events_created']) == 30
    assert len(data_30['chart_data']['registrations']) == 30
    assert len(data_30['chart_data']['revenue']) == 30

    # Retrieve custom days=14 dashboard
    res_14 = client.get('/analytics/admin/dashboard?days=14', headers=auth_header(tokens['admin']))
    assert res_14.status_code == 200
    data_14 = res_14.json()
    assert len(data_14['chart_data']['events_created']) == 14
    assert len(data_14['chart_data']['registrations']) == 14
    assert len(data_14['chart_data']['revenue']) == 14

