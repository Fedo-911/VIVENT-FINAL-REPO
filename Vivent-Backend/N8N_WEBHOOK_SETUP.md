# VIVENT Social Agent Webhook

Import `AI Social Media Content Generator (NVIDIA NIM) (4).json` into n8n and
activate it. Its receiving node is named `VIVENT Campaign Webhook`.

Set these n8n environment variables:

```env
VIVENT_WEBHOOK_SECRET=<same value as N8N_SOCIAL_WEBHOOK_SECRET>
VIVENT_API_URL=https://your-api.example.com
AUTOMATION_CALLBACK_SECRET=<same value as FastAPI>
```

Set FastAPI's `N8N_SOCIAL_WEBHOOK_URL` to the active n8n production URL:

```text
https://your-n8n.example.com/webhook/vivent-social-campaign
```

For n8n's test listener, use `/webhook-test/vivent-social-campaign` only while
the editor is listening. Use the production URL after activating the workflow.

The n8n result callback is:

```text
POST https://your-api.example.com/automation/social-media/results
X-VIVENT-Webhook-Secret: <AUTOMATION_CALLBACK_SECRET>
```

Do not put either secret in React, Supabase public configuration, or a browser request.
