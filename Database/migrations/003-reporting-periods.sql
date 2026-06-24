-- Migration 003: Reporting periods / deadlines
-- Table is already created in 01-schema.sql; this is a no-op safety guard.

CREATE TABLE IF NOT EXISTS reporting_periods (
    period_id        SERIAL PRIMARY KEY,
    reporting_month  VARCHAR(7) NOT NULL UNIQUE,
    opens_at         TIMESTAMPTZ NOT NULL,
    deadline         TIMESTAMPTZ NOT NULL,
    closes_at        TIMESTAMPTZ,
    is_locked        BOOLEAN NOT NULL DEFAULT FALSE,
    locked_by        INTEGER REFERENCES staff(staff_id),
    locked_at        TIMESTAMPTZ,
    created_by       INTEGER REFERENCES staff(staff_id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reporting_periods_month ON reporting_periods(reporting_month);
