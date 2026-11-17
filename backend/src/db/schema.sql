-- Community Water Contamination Reporting and Risk-Mapping Portal (Group G315)
-- PostgreSQL 18 Relational + JSONB Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(25),
    role VARCHAR(30) NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'tester', 'authority', 'admin')),
    jurisdiction VARCHAR(120) DEFAULT 'Gautam Buddha Nagar (Greater Noida)',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_sources (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(160) NOT NULL,
    source_type VARCHAR(40) NOT NULL CHECK (source_type IN ('handpump', 'well', 'tank', 'other')),
    description TEXT,
    locality VARCHAR(140) NOT NULL,
    jurisdiction VARCHAR(120) NOT NULL DEFAULT 'Gautam Buddha Nagar (Greater Noida)',
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    risk_score NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    confidence_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (confidence_level IN ('low', 'medium', 'high')),
    status VARCHAR(30) NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'verified', 'under_treatment', 'resolved')),
    latest_parameters JSONB DEFAULT '{}'::jsonb,
    authority_notes TEXT,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_water_sources_coords ON water_sources (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_water_sources_risk ON water_sources (risk_level, status);

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES water_sources(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reporter_name VARCHAR(120) NOT NULL DEFAULT 'Anonymous Citizen',
    reporter_phone VARCHAR(30),
    reporter_role VARCHAR(30) NOT NULL DEFAULT 'citizen',
    report_type VARCHAR(40) NOT NULL CHECK (report_type IN ('visual_complaint', 'test_reading', 'symptom_report')),
    test_parameters JSONB DEFAULT '{}'::jsonb,
    symptom_data JSONB DEFAULT '{}'::jsonb,
    visual_issues JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    photo_url VARCHAR(255),
    calculated_report_risk NUMERIC(5, 2) DEFAULT 0,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'resolved')),
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    authority_remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_source_id ON reports (source_id, created_at DESC);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES water_sources(id) ON DELETE CASCADE,
    report_id INTEGER REFERENCES reports(id) ON DELETE SET NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('warning', 'critical')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    assigned_jurisdiction VARCHAR(120) NOT NULL DEFAULT 'Gautam Buddha Nagar (Greater Noida)',
    notification_channel VARCHAR(60) DEFAULT 'In-App + Email (PHED Dispatch)',
    status VARCHAR(30) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'acknowledged', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status, created_at DESC);
