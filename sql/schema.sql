-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Doctors and their profiles
CREATE TABLE IF NOT EXISTS doctors (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    specialty   VARCHAR(100) NOT NULL,
    bio         TEXT,
    email       VARCHAR(255),
    embedding   VECTOR(768)
);

-- Doctor weekly schedules (0=Sunday, 1=Monday, ..., 6=Saturday)
CREATE TABLE IF NOT EXISTS schedules (
    id          SERIAL PRIMARY KEY,
    doctor_id   INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL
);

-- Patient profiles
CREATE TABLE IF NOT EXISTS patients (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE,
    phone       VARCHAR(20),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id          SERIAL PRIMARY KEY,
    doctor_id   INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id  INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    datetime    TIMESTAMP NOT NULL,
    duration    INTEGER DEFAULT 30,
    status      VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    reason      TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Simulated notifications
CREATE TABLE IF NOT EXISTS notifications (
    id              SERIAL PRIMARY KEY,
    patient_id      INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id  INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('confirmation', 'reminder', 'cancellation')),
    channel         VARCHAR(20) NOT NULL DEFAULT 'email',
    message         TEXT NOT NULL,
    status          VARCHAR(20) DEFAULT 'simulated',
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_doctors_embedding ON doctors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- Index for appointment lookups
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_datetime ON appointments(doctor_id, datetime);
CREATE INDEX IF NOT EXISTS idx_schedules_doctor ON schedules(doctor_id);
