"""Seed mock data with 30 users (15 students, 15 business) and diverse events."""

from __future__ import annotations

import random
from supabase_client import supabase
from utils.helpers import utc_now_iso
from utils.passwords import hash_password

STUDENT_NAMES = [
    "Ayesha Khan", "Hamza Ali", "Minaal Shah", "Zainab Malik", "Bilal Ahmed",
    "Fatima Zahra", "Ali Raza", "Sana Yousaf", "Usman Tariq", "Maryam Bibi",
    "Farhan Saeed", "Hira Mani", "Saad Rafique", "Nida Yasir", "Zouhair Alavi"
]

BUSINESS_NAMES = [
    "TechNova HR", "Creative Media Hub", "DesignCraft Studio", "Digital Wave Technologies",
    "Future AI Labs", "Pixel Creative Agency", "Noman Food Brand", "Bright Future Academy",
    "Educate Pakistan", "BiteSize Catering", "Stark Industries", "Wayne Enterprises",
    "Innovate Lahore", "Campus Careers", "Global Edu Consultants"
]

MOCK_EVENTS = [
    # Job Fairs
    {
        "title": "Mega Career Connect 2026",
        "description": "Connect directly with top tech and finance employers for internships and permanent roles.",
        "category": "job_fair",
        "location": "Expo Center Hall 1, Lahore",
        "max_participants": 500,
    },
    {
        "title": "Campus Hiring Week",
        "description": "Special recruitment drive targeting fresh graduates from national universities.",
        "category": "job_fair",
        "location": "FAST-NUCES Auditorium, Lahore",
        "max_participants": 200,
    },
    {
        "title": "Graduate Recruitment Drive",
        "description": "On-the-spot CV screening and short interviews for business and engineering students.",
        "category": "job_fair",
        "location": "DHA Phase 5, Lahore",
        "max_participants": 300,
    },
    {
        "title": "Tech Talents Summit",
        "description": "A niche career fair dedicated entirely to AI, Data Science, and Software Engineers.",
        "category": "job_fair",
        "location": "Astola Tech Hub, Gulberg, Lahore",
        "max_participants": 150,
    },
    # Food Events
    {
        "title": "Winter Food Carnival",
        "description": "Savor dozens of street food stalls, live BBQ grills, and culinary challenges.",
        "category": "food",
        "location": "Central Lawn, Gulberg, Lahore",
        "max_participants": 1000,
    },
    {
        "title": "Chef's Table Evening",
        "description": "An intimate fine dining showcase with curated courses prepared by master chefs.",
        "category": "food",
        "location": "The Pavillion, DHA Phase 6, Lahore",
        "max_participants": 80,
    },
    {
        "title": "Spicy Street Food Fest",
        "description": "Celebrating the rich, spicy heritage of local traditional foods and snacks.",
        "category": "food",
        "location": "Anarkali Food Street, Lahore",
        "max_participants": 1200,
    },
    {
        "title": "Lahore Culinary Showcase",
        "description": "Organic ingredients, bakery stalls, and contemporary fusion food counters.",
        "category": "food",
        "location": "Model Town Park, Lahore",
        "max_participants": 600,
    },
    # Educational Expos
    {
        "title": "Scholarship Guidance Expo",
        "description": "Learn how to apply for fully-funded international scholarships like Fulbright and Chevening.",
        "category": "educational",
        "location": "Seminar Hall C, Gulberg, Lahore",
        "max_participants": 250,
    },
    {
        "title": "University Admission Fair",
        "description": "Meet representatives from top-tier colleges and universities to secure instant admissions.",
        "category": "educational",
        "location": "Pearl Continental, Lahore",
        "max_participants": 800,
    },
    {
        "title": "Global Study Expo",
        "description": "Your ultimate gate to study abroad in the UK, USA, Canada, and Australia.",
        "category": "educational",
        "location": "Expo Center Hall 2, Lahore",
        "max_participants": 900,
    },
    {
        "title": "Future Minds Seminar",
        "description": "An academic workshop covering critical cognitive skills, writing, and research methods.",
        "category": "educational",
        "location": "LUMS Auditorium, Lahore",
        "max_participants": 180,
    },
    # Expos
    {
        "title": "Tech Innovations Expo",
        "description": "Discover breakthrough gadgets, robotics, consumer electronics, and smart designs.",
        "category": "expo",
        "location": "Suntech Expo Arena, Johar Town, Lahore",
        "max_participants": 1500,
    },
    {
        "title": "Sustainable Green Expo",
        "description": "Exhibiting solar solutions, electric vehicles, and eco-friendly home items.",
        "category": "expo",
        "location": "Gaddafi Stadium Ground, Lahore",
        "max_participants": 1000,
    },
    {
        "title": "Real Estate & Home Expo",
        "description": "Explore prime property investments and modern architectural layouts.",
        "category": "expo",
        "location": "Expo Center Hall 3, Lahore",
        "max_participants": 2000,
    },
    {
        "title": "Creative Design Expo",
        "description": "Showcasing visual arts, interior design concepts, UI/UX galleries, and paintings.",
        "category": "expo",
        "location": "Alhamra Art Council, Lahore",
        "max_participants": 400,
    }
]

def seed_plans_and_admin() -> tuple[str, list[dict]]:
    """Ensure basic plans and admin exist, returning admin ID and plans list."""
    # Seed default plans if missing
    DEFAULT_PLANS = [
        {"name": "Basic", "price": 99.0, "facilities": {"stalls": 1, "seating": 25}},
        {"name": "Normal", "price": 249.0, "facilities": {"stalls": 2, "seating": 75}},
        {"name": "Premium", "price": 499.0, "facilities": {"stalls": 5, "seating": 200}},
    ]
    for plan in DEFAULT_PLANS:
        existing = supabase.table("plans").select("id").eq("name", plan["name"]).execute()
        if not existing.data:
            supabase.table("plans").insert({
                **plan,
                "is_active": True,
                "created_at": utc_now_iso(),
                "updated_at": utc_now_iso()
            }).execute()

    plans_res = supabase.table("plans").select("id", "name").execute()
    plans_list = plans_res.data

    # Seed Admin user if missing
    admin_email = "admin@vivent.com"
    admin_res = supabase.table("users").select("id").eq("email", admin_email).execute()
    if admin_res.data:
        admin_id = admin_res.data[0]["id"]
    else:
        inserted = supabase.table("users").insert({
            "email": admin_email,
            "hashed_password": hash_password("Admin123!"),
            "full_name": "VIVENT Admin",
            "role": "admin",
            "is_active": True,
            "created_at": utc_now_iso(),
            "updated_at": utc_now_iso(),
        }).execute()
        admin_id = inserted.data[0]["id"]

    return admin_id, plans_list

def seed_users() -> tuple[list[str], list[str]]:
    """Seed 15 students and 15 business users, returning list of their user IDs."""
    student_ids = []
    business_ids = []
    pwd_hash = hash_password("User123!")

    # 1. Seed Students
    print("Seeding student users...")
    for idx, name in enumerate(STUDENT_NAMES, start=1):
        email = f"student{idx}@vivent.com"
        existing = supabase.table("users").select("id").eq("email", email).execute()
        if existing.data:
            print(f"  Student {email} already exists.")
            student_ids.append(existing.data[0]["id"])
        else:
            inserted = supabase.table("users").insert({
                "email": email,
                "hashed_password": pwd_hash,
                "full_name": name,
                "role": "student",
                "is_active": True,
                "created_at": utc_now_iso(),
                "updated_at": utc_now_iso()
            }).execute()
            print(f"  Seeded Student: {email}")
            student_ids.append(inserted.data[0]["id"])

    # 2. Seed Businesses
    print("Seeding business users...")
    for idx, name in enumerate(BUSINESS_NAMES, start=1):
        email = f"business{idx}@vivent.com"
        existing = supabase.table("users").select("id").eq("email", email).execute()
        if existing.data:
            print(f"  Business {email} already exists.")
            business_ids.append(existing.data[0]["id"])
        else:
            inserted = supabase.table("users").insert({
                "email": email,
                "hashed_password": pwd_hash,
                "full_name": name,
                "role": "business",
                "is_active": True,
                "created_at": utc_now_iso(),
                "updated_at": utc_now_iso()
            }).execute()
            print(f"  Seeded Business: {email}")
            business_ids.append(inserted.data[0]["id"])

    return student_ids, business_ids

def seed_events(admin_id: str, plans: list[dict], business_ids: list[str]) -> list[str]:
    """Seed multi-category events created by business users."""
    event_ids = []
    print("Seeding diverse events...")

    for idx, event in enumerate(MOCK_EVENTS):
        title = event["title"]
        existing = supabase.table("events").select("id").eq("title", title).execute()
        if existing.data:
            print(f"  Event '{title}' already exists.")
            event_ids.append(existing.data[0]["id"])
            continue

        # Choose a random business creator
        creator_id = random.choice(business_ids)
        # Choose a random plan ID
        plan = random.choice(plans)
        plan_id = plan["id"]

        # Mix the statuses (Approved, Completed, Pending)
        # approved events can be completed if set in the past
        status = "approved" if idx % 3 != 0 else ("pending" if idx % 2 == 0 else "completed")

        start_date = f"2026-12-{idx+1:02d}T10:00:00+00:00"
        end_date = f"2026-12-{idx+1:02d}T17:00:00+00:00"
        
        event_data = {
            "title": title,
            "description": event["description"],
            "category": event["category"],
            "status": status,
            "start_date": start_date,
            "end_date": end_date,
            "location": event["location"],
            "venue_details": {"hall": random.choice(["Hall A", "Room 101", "Central Lawn", "Suntech Pavillion"])},
            "created_by": creator_id,
            "plan_id": plan_id,
            "max_participants": event["max_participants"],
            "current_participants": 0,
            "created_at": utc_now_iso(),
            "updated_at": utc_now_iso()
        }

        if status in ("approved", "completed"):
            event_data["approved_by"] = admin_id

        inserted = supabase.table("events").insert(event_data).execute()
        print(f"  Seeded Event ({event['category'].upper()}): '{title}' [Status: {status}]")
        event_ids.append(inserted.data[0]["id"])

    return event_ids

def seed_registrations_and_payments(student_ids: list[str], event_ids: list[str]) -> None:
    """Seed registrations and mock payments to populate dashboard analytics."""
    print("Seeding event registrations and payments...")
    
    # Query approved events
    approved_events = supabase.table("events").select("id", "title").in_("status", ["approved", "completed"]).execute()
    approved_ids = [e["id"] for e in approved_events.data] if approved_events.data else []
    
    if not approved_ids:
        print("  No approved events found to register students.")
        return

    reg_count = 0
    pay_count = 0

    for idx, student_id in enumerate(student_ids):
        # Register each student to 2-3 random approved events
        events_to_register = random.sample(approved_ids, min(len(approved_ids), random.randint(2, 4)))
        for event_id in events_to_register:
            # Check if registration already exists
            existing = supabase.table("event_registrations").select("id").eq("user_id", student_id).eq("event_id", event_id).execute()
            if existing.data:
                continue

            # Create registration
            reg = supabase.table("event_registrations").insert({
                "user_id": student_id,
                "event_id": event_id,
                "role_at_event": "participant",
                "payment_status": "completed",
                "created_at": utc_now_iso(),
                "updated_at": utc_now_iso()
            }).execute()
            reg_count += 1

            # Create a corresponding payment record
            existing_pay = supabase.table("payments").select("id").eq("user_id", student_id).eq("event_id", event_id).execute()
            if not existing_pay.data:
                supabase.table("payments").insert({
                    "user_id": student_id,
                    "event_id": event_id,
                    "amount": float(random.choice([50, 99, 150])),
                    "status": "completed",
                    "transaction_id": f"txn_{random.randint(100000, 999999)}_{idx}_{reg_count}",
                    "payment_method": random.choice(["card", "easypaisa", "jazzcash"]),
                    "created_at": utc_now_iso(),
                    "updated_at": utc_now_iso()
                }).execute()
                pay_count += 1
                
            # Increment event participant count safely without RPC requirement
            event_current = supabase.table("events").select("current_participants").eq("id", event_id).execute()
            if event_current.data:
                curr = event_current.data[0].get("current_participants", 0) or 0
                supabase.table("events").update({"current_participants": curr + 1}).eq("id", event_id).execute()

    print(f"  Successfully seeded {reg_count} event registrations and {pay_count} financial payment transactions.")

if __name__ == "__main__":
    print("=" * 60)
    print("VIVENT MOCK DATA SEEDER")
    print("=" * 60)
    
    admin_uid, plans_info = seed_plans_and_admin()
    students, businesses = seed_users()
    events = seed_events(admin_uid, plans_info, businesses)
    seed_registrations_and_payments(students, events)
    
    print("=" * 60)
    print("MOCK SEEDING PROCESS COMPLETED SUCCESSFULLY.")
    print("All 30 users, 16 events, registrations, and payments are loaded into Supabase.")
    print("=" * 60)
