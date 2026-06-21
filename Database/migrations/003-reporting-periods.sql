-- Migration 003: Reporting periods / deadlines
-- Adds a reporting_periods table so HQ/Super_Admin can open/close months,
-- set submission deadlines, and lock periods after approval.

CREATE TABLE IF NOT EXISTS reporting_periods (
    period_id        SERIAL PRIMARY KEY,
    reporting_month  VARCHAR(7) NOT NULL UNIQUE,   -- YYYY-MM
    opens_at         TIMESTAMPTZ NOT NULL,
    deadline         TIMESTAMPTZ NOT NULL,
    closes_at        TIMESTAMPTZ,                   -- NULL = still open
    is_locked        BOOLEAN NOT NULL DEFAULT FALSE,
    locked_by        INTEGER REFERENCES staff(staff_id),
    locked_at        TIMESTAMPTZ,
    created_by       INTEGER REFERENCES staff(staff_id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reporting_periods_month ON reporting_periods(reporting_month);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_reporting_periods_updated_at
    BEFORE UPDATE ON reporting_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
