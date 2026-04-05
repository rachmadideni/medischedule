# MediSchedule AI

MediSchedule AI helps patients find the right doctor and book appointments through a simple chat interface. Just describe your symptoms or what you're looking for, and the system takes care of the rest.

It's built on top of Google Gemini AI using a multi-agent setup, where specialized agents work together to handle doctor lookups, bookings, and patient info.

## Tech Stack

- **Runtime:** Node.js + Express + TypeScript
- **AI:** Google ADK (Agent Development Kit) with Gemini 2.0 Flash
- **Database:** AlloyDB with pgvector and google_ml_integration for in-database vector similarity search and embeddings
- **Embeddings:** text-embedding-005 via AlloyDB's `embedding()` function for symptom-based doctor matching

## What It Can Do

- **Find doctors by symptoms** - describe what you're feeling, and it uses vector similarity search to match you with the right specialist
- **Manage appointments** - book, reschedule, or cancel with ease
- **Handle patient profiles** - register new patients and keep their info up to date
- **Send notifications** - get confirmation and reminder emails (simulated) when you book or cancel
- **Coordinate through multiple agents** - an orchestrator routes your request to the right agent (doctor lookup, booking, or patient info) so everything feels seamless

## AlloyDB Setup

Before running the app, the AlloyDB instance needs the `google_ml_integration` extension enabled. This allows the database to generate embeddings and call Vertex AI models directly from SQL.

### 1. Grant IAM permissions to the AlloyDB service account

```bash
PROJECT_ID=$(gcloud config get-value project)

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:service-$(gcloud projects describe $PROJECT_ID \
  --format='value(projectNumber)')@gcp-sa-alloydb.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### 2. Enable the extensions in the database

Connect to your AlloyDB instance and run:

```sql
CREATE EXTENSION IF NOT EXISTS google_ml_integration CASCADE;
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Grant execution permissions

```sql
GRANT EXECUTE ON FUNCTION embedding TO postgres;
```

### 4. Register the Gemini model endpoint (optional, for ai.if() usage)

```sql
CALL google_ml.create_model(
    model_id => 'gemini-3-flash-preview',
    model_request_url => 'https://aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/global/publishers/google/models/gemini-3-flash-preview:generateContent',
    model_qualified_name => 'gemini-3-flash-preview',
    model_provider => 'google',
    model_type => 'llm',
    model_auth_type => 'alloydb_service_agent_iam'
);
```

### 5. Run schema and seed data

```bash
psql -h <ALLOYDB_IP> -U postgres -d medischedule -f sql/schema.sql
psql -h <ALLOYDB_IP> -U postgres -d medischedule -f sql/seed.sql
```

The seed script will automatically generate doctor embeddings in-database using the `embedding()` function.

## API

| Endpoint | Description |
|---|---|
| `POST /chat` | Main conversational interface |
| `GET /sessions/:id` | Session management |
| `GET /health` | Health check |
