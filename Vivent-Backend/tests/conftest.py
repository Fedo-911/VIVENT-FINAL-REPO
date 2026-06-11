from __future__ import annotations

from collections.abc import Callable
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

import dependencies
import main
import supabase_client
import utils.helpers
from routers import ads, admin_events, analytics, auth, discussions, events, notifications, payments, plans, records, registrations, social, users
from utils.jwt_handler import create_access_token
from utils.passwords import hash_password


@dataclass
class FakeResponse:
    data: list[dict[str, Any]]
    count: int | None = None


class FakeQuery:
    def __init__(self, db: dict[str, list[dict[str, Any]]], table_name: str):
        self.db = db
        self.table_name = table_name
        self.operation = 'select'
        self.payload: Any = None
        self.filters: list[Callable[[dict[str, Any]], bool]] = []
        self.order_by: tuple[str, bool] | None = None
        self.range_values: tuple[int, int] | None = None
        self.limit_value: int | None = None
        self.count_requested = False

    def select(self, _columns: str = '*', count: str | None = None):
        self.operation = 'select'
        self.count_requested = count == 'exact'
        return self

    def insert(self, payload: dict[str, Any] | list[dict[str, Any]]):
        self.operation = 'insert'
        self.payload = payload
        return self

    def update(self, payload: dict[str, Any]):
        self.operation = 'update'
        self.payload = payload
        return self

    def delete(self):
        self.operation = 'delete'
        return self

    def eq(self, field: str, value: Any):
        self.filters.append(lambda row, f=field, v=value: row.get(f) == v)
        return self

    def ilike(self, field: str, value: str):
        expected = value.lower()
        self.filters.append(lambda row, f=field, v=expected: str(row.get(f, '')).lower() == v)
        return self

    def in_(self, field: str, values: list[Any]):
        allowed = set(values)
        self.filters.append(lambda row, f=field, v=allowed: row.get(f) in v)
        return self

    def gte(self, field: str, value: Any):
        self.filters.append(lambda row, f=field, v=value: row.get(f) >= v)
        return self

    def lte(self, field: str, value: Any):
        self.filters.append(lambda row, f=field, v=value: row.get(f) <= v)
        return self

    def order(self, field: str, desc: bool = False):
        self.order_by = (field, desc)
        return self

    def range(self, start: int, end: int):
        self.range_values = (start, end)
        return self

    def limit(self, limit: int):
        self.limit_value = limit
        return self

    def execute(self) -> FakeResponse:
        table = self.db[self.table_name]
        if self.operation == 'insert':
            payloads = self.payload if isinstance(self.payload, list) else [self.payload]
            inserted: list[dict[str, Any]] = []
            for payload in payloads:
                row = deepcopy(payload)
                row.setdefault('id', str(uuid4()))
                table.append(row)
                inserted.append(deepcopy(row))
            return FakeResponse(data=inserted, count=len(inserted))

        matched = [row for row in table if all(check(row) for check in self.filters)]
        count = len(matched) if self.count_requested else None

        if self.operation == 'update':
            updated = []
            for row in matched:
                row.update(deepcopy(self.payload))
                updated.append(deepcopy(row))
            return FakeResponse(data=updated, count=len(updated))

        if self.operation == 'delete':
            deleted = [deepcopy(row) for row in matched]
            self.db[self.table_name] = [row for row in table if row not in matched]
            return FakeResponse(data=deleted, count=len(deleted))

        rows = [deepcopy(row) for row in matched]
        if self.order_by:
            field, desc = self.order_by
            rows.sort(key=lambda row: row.get(field), reverse=desc)
        if self.range_values:
            start, end = self.range_values
            rows = rows[start:end + 1]
        if self.limit_value is not None:
            rows = rows[:self.limit_value]
        return FakeResponse(data=rows, count=count)


class FakeSupabase:
    def __init__(self, seed_data: dict[str, list[dict[str, Any]]]):
        self.db = deepcopy(seed_data)

    def table(self, table_name: str) -> FakeQuery:
        self.db.setdefault(table_name, [])
        return FakeQuery(self.db, table_name)


@pytest.fixture
def seeded_data() -> dict[str, list[dict[str, Any]]]:
    now = datetime.now(timezone.utc)

    def ts(days: int = 0) -> str:
        return (now + timedelta(days=days)).isoformat()

    admin_id = '11111111-1111-1111-1111-111111111111'
    student_id = '22222222-2222-2222-2222-222222222222'
    business_id = '33333333-3333-3333-3333-333333333333'
    basic_plan_id = '44444444-4444-4444-4444-444444444444'
    normal_plan_id = '55555555-5555-5555-5555-555555555555'
    event_id = '66666666-6666-6666-6666-666666666666'
    notification_id = '77777777-7777-7777-7777-777777777777'

    return {
        'users': [
            {
                'id': admin_id,
                'email': 'admin@vivent.com',
                'hashed_password': hash_password('Admin123!'),
                'full_name': 'Admin User',
                'role': 'admin',
                'is_active': True,
                'created_at': ts(-10),
                'updated_at': ts(-10),
            },
            {
                'id': student_id,
                'email': 'student@example.com',
                'hashed_password': hash_password('Student123!'),
                'full_name': 'Student User',
                'role': 'student',
                'is_active': True,
                'created_at': ts(-9),
                'updated_at': ts(-9),
            },
            {
                'id': business_id,
                'email': 'business@example.com',
                'hashed_password': hash_password('Business123!'),
                'full_name': 'Business User',
                'role': 'business',
                'is_active': True,
                'created_at': ts(-8),
                'updated_at': ts(-8),
            },
        ],
        'plans': [
            {
                'id': basic_plan_id,
                'name': 'Basic',
                'price': 99.0,
                'facilities': {'parking': False, 'social_media_ads': ['offline_posters']},
                'is_active': True,
                'created_at': ts(-10),
                'updated_at': ts(-10),
            },
            {
                'id': normal_plan_id,
                'name': 'Normal',
                'price': 249.0,
                'facilities': {'parking': True, 'social_media_ads': ['instagram', 'facebook']},
                'is_active': True,
                'created_at': ts(-10),
                'updated_at': ts(-10),
            },
        ],
        'events': [
            {
                'id': event_id,
                'title': 'Business Expo',
                'description': 'Seeded approved business event',
                'category': 'expo',
                'status': 'approved',
                'start_date': ts(5),
                'end_date': ts(6),
                'location': 'Karachi',
                'venue_details': {'hall': 'Main'},
                'created_by': business_id,
                'approved_by': admin_id,
                'plan_id': basic_plan_id,
                'max_participants': 100,
                'current_participants': 0,
                'created_at': ts(-4),
                'updated_at': ts(-4),
            },
        ],
        'event_registrations': [],
        'payments': [],
        'discussions': [],
        'social_media_ads': [],
        'notifications': [
            {
                'id': notification_id,
                'user_id': student_id,
                'title': 'Welcome',
                'message': 'Seeded notification',
                'is_read': False,
                'created_at': ts(-1),
                'updated_at': ts(-1),
            }
        ],
        'analytics_cache': [],
        'linked_social_accounts': [],
    }


import utils.cache_worker

@pytest.fixture
def fake_supabase(seeded_data, monkeypatch) -> FakeSupabase:
    fake = FakeSupabase(seeded_data)
    modules = [
        supabase_client,
        dependencies,
        utils.helpers,
        utils.cache_worker,
        auth,
        users,
        events,
        admin_events,
        plans,
        registrations,
        payments,
        ads,
        discussions,
        notifications,
        analytics,
        records,
        social,
    ]
    for module in modules:
        monkeypatch.setattr(module, 'supabase', fake, raising=False)
    monkeypatch.setattr(main, 'validate_supabase_access', lambda: None)
    return fake


@pytest.fixture
def client(fake_supabase) -> TestClient:
    with TestClient(main.app) as test_client:
        yield test_client


@pytest.fixture
def tokens() -> dict[str, str]:
    return {
        'admin': create_access_token('11111111-1111-1111-1111-111111111111', 'admin', 'admin@vivent.com'),
        'student': create_access_token('22222222-2222-2222-2222-222222222222', 'student', 'student@example.com'),
        'business': create_access_token('33333333-3333-3333-3333-333333333333', 'business', 'business@example.com'),
    }


def auth_header(token: str) -> dict[str, str]:
    return {'Authorization': f'Bearer {token}'}
