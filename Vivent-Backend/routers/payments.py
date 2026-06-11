"""Payment routes."""

from __future__ import annotations

from decimal import Decimal
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import HTMLResponse

from dependencies import get_current_user
from schemas import PaymentInitiate, PaymentOut, StripeSessionCreate, StripeSessionOut
from supabase_client import supabase
from utils.helpers import create_notification, generate_transaction_id, get_row_or_404, utc_now_iso

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/initiate", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def initiate_payment(payload: PaymentInitiate, current_user: dict = Depends(get_current_user)) -> dict:
    """Simulate a successful payment for the current user."""
    event = get_row_or_404("events", payload.event_id)
    registration_response = (
        supabase.table("event_registrations")
        .select("*")
        .eq("event_id", payload.event_id)
        .eq("user_id", current_user["id"])
        .limit(1)
        .execute()
    )
    registration = registration_response.data[0] if registration_response.data else None
    if not registration and current_user["role"] != "admin" and event["created_by"] != current_user["id"]:
        raise HTTPException(status_code=400, detail="Register for the event before making a payment.")

    payment_data = {
        "user_id": current_user["id"],
        "event_id": payload.event_id,
        "amount": float(payload.amount),
        "status": "completed",
        "transaction_id": generate_transaction_id(),
        "payment_method": payload.payment_method,
        "created_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    }
    response = supabase.table("payments").insert(payment_data).execute()
    payment = response.data[0]

    if registration:
        supabase.table("event_registrations").update(
            {
                "payment_status": "completed",
                "payment_id": payment["id"],
                "updated_at": utc_now_iso(),
            }
        ).eq("id", registration["id"]).execute()

    create_notification(
        current_user["id"],
        "Payment Confirmed",
        f"Payment for '{event['title']}' has been completed. Transaction: {payment['transaction_id']}",
    )
    return payment


@router.get("/user", response_model=list[PaymentOut])
def list_user_payments(current_user: dict = Depends(get_current_user)) -> list[dict]:
    """List current user payments."""
    response = (
        supabase.table("payments")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


@router.get("/event/{event_id}", response_model=list[PaymentOut])
def list_event_payments(event_id: str, current_user: dict = Depends(get_current_user)) -> list[dict]:
    """List payments for an event for organisers or admins."""
    event = get_row_or_404("events", event_id)
    if current_user["role"] != "admin" and event["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You do not have permission to view event payments.")
    response = supabase.table("payments").select("*").eq("event_id", event_id).order("created_at", desc=True).execute()
    return response.data or []


@router.post("/stripe/create-checkout-session", response_model=StripeSessionOut, status_code=status.HTTP_201_CREATED)
def create_stripe_checkout_session(
    payload: StripeSessionCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Create a mock Stripe Checkout Session."""
    event = get_row_or_404("events", payload.event_id)
    
    # Check registration
    reg_res = (
        supabase.table("event_registrations")
        .select("*")
        .eq("event_id", payload.event_id)
        .eq("user_id", current_user["id"])
        .limit(1)
        .execute()
    )
    registration = reg_res.data[0] if reg_res.data else None
    if not registration and current_user["role"] != "admin" and event["created_by"] != current_user["id"]:
        raise HTTPException(status_code=400, detail="Register for the event before making a payment.")

    # Determine event price based on plans
    plan_res = supabase.table("plans").select("price").eq("id", event["plan_id"]).limit(1).execute()
    price = float(plan_res.data[0]["price"]) if plan_res.data else 99.0
    
    session_id = f"cs_test_{uuid4().hex}"
    
    # Construct dynamic mock checkout portal URL
    base_url = str(request.base_url).rstrip("/")
    reg_id = registration["id"] if registration else ""
    checkout_url = (
        f"{base_url}/payments/stripe/mock-checkout"
        f"?session_id={session_id}"
        f"&user_id={current_user['id']}"
        f"&event_id={payload.event_id}"
        f"&amount={price}"
        f"&reg_id={reg_id}"
    )
    
    return {
        "session_id": session_id,
        "checkout_url": checkout_url,
        "amount": price,
        "currency": "usd"
    }


@router.get("/stripe/mock-checkout", response_class=HTMLResponse)
def get_mock_checkout_portal(
    session_id: str,
    user_id: str,
    event_id: str,
    amount: float,
    reg_id: str = ""
) -> HTMLResponse:
    """Serve a beautifully styled interactive mock Stripe Checkout portal."""
    event = get_row_or_404("events", event_id)
    title = event.get("title", "VIVENT Event Registration")
    description = event.get("description", "Premium Event Access Fee")
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stripe Checkout Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
        }}
        body {{
            background-color: #f1f5f9;
            color: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            display: flex;
            max-width: 850px;
            width: 100%;
            overflow: hidden;
            position: relative;
        }}
        .left-panel {{
            background: linear-gradient(135deg, #1e3a8a, #0f172a);
            color: white;
            flex: 1;
            padding: 40px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }}
        .right-panel {{
            flex: 1.2;
            padding: 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }}
        .brand {{
            font-weight: 800;
            font-size: 24px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }}
        .price {{
            font-size: 40px;
            font-weight: 700;
            margin: 20px 0;
        }}
        .event-details {{
            font-size: 14px;
            opacity: 0.8;
            line-height: 1.6;
        }}
        .stripe-logo {{
            font-size: 12px;
            opacity: 0.6;
            margin-top: 40px;
        }}
        h2 {{
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 24px;
            color: #0f172a;
        }}
        .form-group {{
            margin-bottom: 20px;
        }}
        label {{
            display: block;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 8px;
        }}
        input {{
            width: 100%;
            padding: 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
        }}
        input:focus {{
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }}
        .row {{
            display: flex;
            gap: 16px;
        }}
        .row > .form-group {{
            flex: 1;
        }}
        .pay-btn {{
            background-color: #6366f1;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 14px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 10px;
        }}
        .pay-btn:hover {{
            background-color: #4f46e5;
        }}
        .pay-btn:disabled {{
            background-color: #94a3b8;
            cursor: not-allowed;
        }}
        .spinner {{
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 18px;
            height: 18px;
            animation: spin 1s linear infinite;
            display: none;
        }}
        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}
        .success-overlay {{
            position: absolute;
            inset: 0;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
            border-radius: 16px;
        }}
        .success-checkmark {{
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #dcfce7;
            color: #15803d;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            margin-bottom: 20px;
            animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }}
        @keyframes pop {{
            0% {{ transform: scale(0); }}
            100% {{ transform: scale(1); }}
        }}
        .success-title {{
            font-size: 22px;
            font-weight: 700;
            color: #15803d;
            margin-bottom: 8px;
        }}
        .success-text {{
            font-size: 14px;
            color: #64748b;
            text-align: center;
            max-width: 320px;
            line-height: 1.5;
        }}
        @media (max-width: 680px) {{
            .container {{
                flex-direction: column;
            }}
            .left-panel {{
                padding: 30px;
            }}
            .right-panel {{
                padding: 30px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="left-panel">
            <div>
                <div class="brand">VIVENT</div>
                <div class="stripe-logo" style="margin-top: 5px;">STRIPE CHECKOUT SIMULATOR</div>
            </div>
            <div>
                <p style="text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; opacity: 0.6;">Event Registration Fee</p>
                <div class="price">${amount:.2f}</div>
                <div class="event-details">
                    <p style="font-weight: 600; font-size: 16px; margin-bottom: 5px;">{title}</p>
                    <p>{description[:160]}...</p>
                </div>
            </div>
            <div class="stripe-logo">
                Secured by Stripe Mock Webhook Integration
            </div>
        </div>
        <div class="right-panel">
            <h2>Payment Details</h2>
            <form id="payment-form" onsubmit="return false;">
                <div class="form-group">
                    <label>Cardholder Name</label>
                    <input type="text" id="cardholder" value="Jane Doe" required>
                </div>
                <div class="form-group">
                    <label>Card Information</label>
                    <input type="text" id="card-num" value="4242  4242  4242  4242" required>
                </div>
                <div class="row">
                    <div class="form-group">
                        <label>Expiry Date</label>
                        <input type="text" id="expiry" value="12 / 29" required>
                    </div>
                    <div class="form-group">
                        <label>CVC</label>
                        <input type="text" id="cvc" value="424" required>
                    </div>
                </div>
                <button class="pay-btn" id="pay-button">
                    <span class="spinner" id="btn-spinner"></span>
                    <span id="btn-text">Pay ${amount:.2f}</span>
                </button>
            </form>
        </div>
        <div class="success-overlay" id="success-screen">
            <div class="success-checkmark">✓</div>
            <div class="success-title">Payment Completed</div>
            <div class="success-text">Your registration is now fully approved! Redirecting back to your event feed...</div>
        </div>
    </div>

    <script>
        const payButton = document.getElementById("pay-button");
        const btnText = document.getElementById("btn-text");
        const btnSpinner = document.getElementById("btn-spinner");
        const successScreen = document.getElementById("success-screen");

        payButton.addEventListener("click", async () => {{
            payButton.disabled = true;
            btnText.style.display = "none";
            btnSpinner.style.display = "block";

            // Replicate standard Stripe webhook payload postback
            const webhookUrl = "/payments/stripe/webhook";
            const payload = {{
                id: "evt_test_" + Math.random().toString(36).substring(7),
                object: "event",
                type: "checkout.session.completed",
                data: {{
                    object: {{
                        id: "{session_id}",
                        amount_total: Math.round({amount} * 100),
                        currency: "usd",
                        payment_status: "paid",
                        metadata: {{
                            user_id: "{user_id}",
                            event_id: "{event_id}",
                            reg_id: "{reg_id}"
                        }}
                    }}
                }}
            }};

            try {{
                const response = await fetch(webhookUrl, {{
                    method: "POST",
                    headers: {{
                        "Content-Type": "application/json"
                    }},
                    body: JSON.stringify(payload)
                }});

                const result = await response.json();
                if (response.ok) {{
                    setTimeout(() => {{
                        successScreen.style.opacity = "1";
                        setTimeout(() => {{
                            // Redirect back dynamically
                            window.location.href = "/";
                        }}, 2000);
                    }}, 1000);
                }} else {{
                    alert("Webhook process failed: " + JSON.stringify(result));
                    payButton.disabled = false;
                    btnText.style.display = "block";
                    btnSpinner.style.display = "none";
                }}
            }} catch (error) {{
                alert("Connection failed: " + error);
                payButton.disabled = false;
                btnText.style.display = "block";
                btnSpinner.style.display = "none";
            }}
        }});
    </script>
</body>
</html>"""
    return HTMLResponse(content=html_content, status_code=200)


@router.post("/stripe/webhook", status_code=status.HTTP_200_OK)
def stripe_webhook(payload: dict) -> dict:
    """Receive and process mock Stripe Webhook events asynchronously."""
    event_type = payload.get("type")
    if event_type != "checkout.session.completed":
        return {"status": "ignored", "reason": f"Unhandled event type '{event_type}'"}
        
    session = payload.get("data", {}).get("object", {})
    session_id = session.get("id")
    amount_cents = session.get("amount_total", 0)
    amount = float(amount_cents) / 100.0
    
    metadata = session.get("metadata", {})
    user_id = metadata.get("user_id")
    event_id = metadata.get("event_id")
    reg_id = metadata.get("reg_id")
    
    if not user_id or not event_id:
        raise HTTPException(status_code=400, detail="Missing required user_id or event_id metadata.")
        
    event = get_row_or_404("events", event_id)
    
    # Prevent double-processing
    existing_payment = supabase.table("payments").select("id").eq("transaction_id", session_id).execute()
    if existing_payment.data:
        return {"status": "skipped", "reason": "Transaction already processed."}
        
    # Write payment ledger
    payment_data = {
        "user_id": user_id,
        "event_id": event_id,
        "amount": amount,
        "status": "completed",
        "transaction_id": session_id,
        "payment_method": "stripe_card",
        "created_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    }
    pay_res = supabase.table("payments").insert(payment_data).execute()
    payment = pay_res.data[0]
    
    # Update registration payment status
    if reg_id:
        supabase.table("event_registrations").update({
            "payment_status": "completed",
            "payment_id": payment["id"],
            "updated_at": utc_now_iso()
        }).eq("id", reg_id).execute()
        
    # Send user notification
    create_notification(
        user_id,
        "Payment Confirmed via Stripe",
        f"Your Stripe payment of ${amount:.2f} for '{event['title']}' was processed. Transaction: {session_id}"
    )
    
    return {"status": "success", "payment_id": payment["id"]}

