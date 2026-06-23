-- ================================================================
-- EXTENSIONS
-- ================================================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- REFERENCE TABLES (Lookup data, manually changed)
-- ================================================================

-- Damage policies
CREATE TABLE damage_policies (
    id                        TEXT PRIMARY KEY,
    name                      TEXT NOT NULL UNIQUE,
    description               TEXT NOT NULL,
    responsibility_percentage SMALLINT NOT NULL CHECK (responsibility_percentage BETWEEN 0 AND 100),
    created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loan_statuses (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item_conditions (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                     TEXT NOT NULL UNIQUE,
    description              TEXT NOT NULL,
    suggested_repair_cost    DECIMAL(10,2),
    suggested_value          DECIMAL(10,2),
    default_damage_policy_id TEXT NOT NULL REFERENCES damage_policies(id),
    metadata_schema          JSONB,  -- Defines expected fields for items in this category
    created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_types (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    requires_email BOOLEAN NOT NULL DEFAULT false,
    requires_push  BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispute_statuses (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rating_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- ================================================================
-- CORE TABLES
-- ================================================================

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         TEXT UNIQUE NOT NULL,
    username      TEXT UNIQUE NOT NULL,
    first_name    TEXT NOT NULL,
    last_name     TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- Availability
    is_online BOOLEAN NOT NULL DEFAULT false, 

    -- Location
    current_location     GEOMETRY(POINT, 4326),
    last_location_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Verification
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    phone_number   TEXT,
    
    -- Preferences
    notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb,
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC+0',
    
    -- Chronological data
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    -- Identifiers
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Basic info
    name        TEXT NOT NULL,
    description TEXT,
    images      TEXT[],
    
    -- Location
    current_location GEOMETRY(POINT, 4326) NOT NULL,
    
    -- GPS Tracking
    -- gps_tracker_id TEXT REFERENCES gps_trackers(id),
    
    -- Condition & value (user-provided or defaults)
    condition_id          TEXT NOT NULL REFERENCES item_conditions(id) DEFAULT 'excellent',
    estimated_repair_cost DECIMAL(10,2),
    estimated_value       DECIMAL(10,2),
    
    -- Default damage policy (can be overridden per loan)
    default_damage_policy_id TEXT NOT NULL REFERENCES damage_policies(id) DEFAULT 'trust_based',
    
    -- Extensibility
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Chronological data
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT nonnegative_repair_cost CHECK (estimated_repair_cost >= 0),
    CONSTRAINT positive_value          CHECK (estimated_value > 0),
    CONSTRAINT positive_max_loan_days  CHECK (max_loan_days > 0),
    CONSTRAINT repair_less_than_value CHECK (
        (estimated_repair_cost IS NULL) OR 
        (estimated_value IS NULL) OR 
        (estimated_repair_cost <= estimated_value)
    )
);

CREATE TABLE loans (
    -- Identifiers
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id     UUID NOT NULL REFERENCES items(id),
    lender_id   UUID NOT NULL REFERENCES users(id),
    borrower_id UUID NOT NULL REFERENCES users(id),
    
    -- Timeline
    requested_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date           TIMESTAMP,
    expected_return_date TIMESTAMP,
    actual_return_date   TIMESTAMP,
    
    -- Signing process timestamps
    terms_proposed_at  TIMESTAMP,
    terms_accepted_at  TIMESTAMP,
    lender_signed_at   TIMESTAMP,
    borrower_signed_at TIMESTAMP,
    
    -- Agreed contract terms
    agreed_damage_policy_id TEXT NOT NULL REFERENCES damage_policies(id),
    agreed_repair_cost      DECIMAL(10,2) NOT NULL,
    agreed_value            DECIMAL(10,2) NOT NULL,
    agreed_max_loan_days    SMALLINT NOT NULL,
    
    -- Status
    status        TEXT NOT NULL REFERENCES loan_statuses(id) DEFAULT 'draft',
    
    -- Condition tracking
    condition_on_borrow_id TEXT REFERENCES item_conditions(id),
    condition_on_return_id TEXT REFERENCES item_conditions(id),
    damage_description     TEXT,
    damage_photos          TEXT[],

    -- Generated data flag
    is_generated BOOLEAN DEFAULT false,
    
    -- Loan metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Chronological data
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT different_parties CHECK (lender_id != borrower_id),
    CONSTRAINT valid_dates CHECK (
        (start_date IS NULL AND expected_return_date IS NULL) OR
        (start_date     <= expected_return_date) OR
        (start_date     <= actual_return_date)
    ),
    CONSTRAINT signing_order CHECK (
        (terms_proposed_at IS NULL AND terms_accepted_at IS NULL) OR
        (terms_accepted_at >= terms_proposed_at)
    )
);

CREATE TABLE ratings (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id       UUID NOT NULL UNIQUE REFERENCES loans(id) ON DELETE CASCADE,
    rater_id      UUID NOT NULL UNIQUE REFERENCES users(id),
    ratee_id      UUID NOT NULL UNIQUE REFERENCES users(id),
    category_id   TEXT NOT NULL REFERENCES rating_categories(id),
    rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review        TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disputes (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id          UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    opened_by        UUID NOT NULL REFERENCES users(id),
    opened_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason           TEXT NOT NULL,
    description      TEXT,
    status           TEXT REFERENCES dispute_statuses(id) DEFAULT 'open',  -- open, investigating, resolved
    resolved_by      UUID REFERENCES users(id),
    resolved_at      TIMESTAMP,
    resolution_notes TEXT
);

CREATE TABLE gps_trackers (
    id              TEXT PRIMARY KEY,
    name            TEXT,   -- user-assigned name for the tracker
    item_id         UUID UNIQUE REFERENCES items(id) ON DELETE SET NULL,
    battery_level   SMALLINT CHECK (battery_level BETWEEN 0 AND 100),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE location_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id         UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    loan_id         UUID REFERENCES loans(id) ON DELETE SET NULL,
    location        GEOMETRY(POINT, 4326) NOT NULL,
    recorded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_type     TEXT DEFAULT 'manual',  -- 'manual', 'gps_tracker', 'phone'
    source_id       TEXT,
    battery_level   SMALLINT CHECK (battery_level BETWEEN 0 AND 100),
    accuracy_meters SMALLINT,
    metadata        JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL REFERENCES notification_types(id),
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,
    data       JSONB,   -- Additional context (loan_id, item_id, etc.)
    is_read    BOOLEAN DEFAULT false,
    read_at    TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    loan_id     UUID REFERENCES loans(id),
    action      VARCHAR(100) NOT NULL,
    entity_type TEXT,
    entity_id   UUID,
    signature   TEXT,  -- HMAC signature for tamper evidence
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- INDEXES
-- ================================================================

-- Geospatial indexes
CREATE INDEX idx_users_location ON users USING GIST (current_location);
CREATE INDEX idx_items_location ON items USING GIST (current_location);
CREATE INDEX idx_location_history_point ON location_history USING GIST (location);
CREATE INDEX idx_location_history_item_time ON location_history (item_id, recorded_at DESC);

-- Foreign key indexes
CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_loans_item ON loans(item_id);
CREATE INDEX idx_loans_lender ON loans(lender_id);
CREATE INDEX idx_loans_borrower ON loans(borrower_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_ratings_loan ON ratings(loan_id);
CREATE INDEX idx_ratings_ratee ON ratings(ratee_id);
CREATE INDEX idx_ratings_rater ON ratings(rater_id);
CREATE INDEX idx_disputes_loan ON disputes(loan_id);
CREATE INDEX idx_disputes_user ON disputes(opened_by);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_audit_loan ON audit_log(loan_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);

-- Business logic indexes
CREATE INDEX idx_loans_active ON loans(status) WHERE status IN ('pending_meetup', 'active');
CREATE INDEX idx_users_email ON users(email);

-- Compound indexes for common queries
CREATE INDEX idx_loans_lender_status ON loans(lender_id, status);
CREATE INDEX idx_loans_borrower_status ON loans(borrower_id, status);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at      BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at      BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at      BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Hash audit log chain (tamper evidence)
CREATE OR REPLACE FUNCTION hash_audit_chain()
RETURNS TRIGGER AS $$
BEGIN
    NEW.signature = encode(
        sha256(
            COALESCE(
                (SELECT signature FROM audit_log ORDER BY created_at DESC LIMIT 1), 
                'GENESIS_' || NOW()::text
            )::bytea || 
            NEW.id::bytea || 
            NEW.created_at::bytea
        ), 'hex'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_chain
    BEFORE INSERT ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION hash_audit_chain();

-- =====================================================
-- VIEWS
-- =====================================================

-- User reputation
CREATE VIEW user_reputation AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    5.0 as reputation_score,  -- Simplified for now
    0 as total_loans_completed,
    0 as active_loans
FROM users u;

-- Available items
CREATE VIEW available_items_view AS
SELECT 
    i.id,
    i.name,
    i.description,
    i.images,
    i.current_location,
    ST_X(i.current_location::geometry) as longitude,
    ST_Y(i.current_location::geometry) as latitude,
    i.max_loan_days,
    i.estimated_repair_cost,
    i.estimated_value,
    i.default_damage_policy_id,
    dp.name as damage_policy_name,
    u.id as owner_id,
    u.first_name as owner_first_name,
    u.last_name as owner_last_name,
    c.name as category_name
FROM items i
JOIN users u ON i.owner_id = u.id
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN damage_policies dp ON i.default_damage_policy_id = dp.id;

-- =====================================================
-- FUNCTIONS
-- =====================================================

CREATE FUNCTION calculate_distance(
    user_lat DOUBLE PRECISION,
    user_lon DOUBLE PRECISION,
    item_id UUID
) RETURNS TABLE(
    distance_meters DOUBLE PRECISION, 
    estimated_walking_minutes INTEGER,
    estimated_driving_minutes INTEGER
) AS $$
DECLARE
    item_location GEOMETRY;
    distance_m DOUBLE PRECISION;
BEGIN
    SELECT current_location INTO item_location FROM items WHERE id = item_id;
    
    distance_m := ST_DistanceSphere(
        ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326),
        item_location
    );
    
    distance_meters := distance_m;
    estimated_walking_minutes := (distance_m / 1000.0 / 5.0  * 60)::INTEGER;
    estimated_driving_minutes := (distance_m / 1000.0 / 30.0 * 60)::INTEGER;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;


-- ================================================================
-- REFERENCE TABLES DATA
-- ================================================================

INSERT INTO damage_policies (id, name, description, responsibility_percentage) VALUES
    ('full_responsibility', 'Full Responsibility', 'Borrower agrees to pay repair or replacement cost for any damage in full.', 100),
    ('limited_responsibility', 'Limited Responsibility', 'Borrower agrees to pay repair or replacement cost for any damage in half.', 50),
    ('insurance_coverage', 'Insurance Coverage', 'All damage claims handled through LendLoop insurance.', 0),
    ('trust_based', 'Trust Based', 'No formal policy - both parties resolve issues amicably.', 0);

INSERT INTO loan_statuses (id, name, description) VALUES
    ('draft', 'Draft', 'Initial state, terms not yet proposed.'),
    ('terms_proposed', 'Terms Proposed', 'Lender proposed terms, awaiting borrower agreement.'),
    ('terms_agreed', 'Terms Agreed', 'Borrower accepted terms.'),
    ('pending_meetup', 'Awaiting Meetup', 'Both parties agreed, waiting for physical handover.'),
    ('active', 'Active', 'Item is with borrower.'),
    ('returned', 'Returned', 'Item returned, awaiting completion.'),
    ('completed', 'Completed', 'Loan finished successfully.'),
    ('rejected', 'Rejected', 'Lender declined request.'),
    ('cancelled', 'Cancelled', 'Borrower cancelled before meetup.'),
    ('disputed', 'Disputed', 'Issue reported.'),
    ('resolved', 'Resolved', 'Dispute settled.');

INSERT INTO item_conditions (id, name, description) VALUES
    ('excellent', 'Excellent', 'Like new, no visible wear.'),
    ('good', 'Good', 'Minor wear, fully functional.'),
    ('fair', 'Fair', 'Visible wear, fully functional.'),
    ('poor', 'Poor', 'Cosmetic damage, functional.'),
    ('damaged', 'Damaged', 'Needs repair before next use.');

INSERT INTO rating_categories (id, name, description) VALUES
    ('overall', 'Overall Experience', 'General satisfaction'),
    ('communication', 'Communication', 'Responsiveness and clarity'),
    ('punctuality', 'Punctuality', 'On-time pickup and return'),
    ('item_condition', 'Item Condition', 'Item as described');

INSERT INTO notification_types (id, name, requires_email, requires_push) VALUES
    ('loan_request', 'New Loan Request', true, true),
    ('terms_proposed', 'Terms Proposed', true, true),
    ('terms_accepted', 'Terms Accepted', true, true),
    ('contract_signed', 'Contract Signed', true, true),
    ('return_reminder', 'Return Reminder', true, true),
    ('overdue_notice', 'Overdue Notice', true, true),
    ('dispute_opened', 'Dispute Opened', true, true),
    ('dispute_resolved', 'Dispute Resolved', true, true);

INSERT INTO categories (name, description, suggested_repair_cost, suggested_value, default_damage_policy_id) VALUES
    ('Power Tools', 'Drills, saws, sanders, and other power tools', 75.00, 150.00, 'full_responsibility'),
    ('Hand Tools', 'Wrenches, hammers, screwdrivers, hand tools', 25.00, 50.00, 'full_responsibility'),
    ('Cameras', 'DSLR, mirrorless, action cameras', 200.00, 500.00, 'insurance_coverage'),
    ('Laptops', 'Notebooks, MacBooks, Windows laptops', 300.00, 800.00, 'insurance_coverage'),
    ('Bicycles', 'Mountain bikes, road bikes, city bikes', 100.00, 400.00, 'limited_responsibility'),
    ('Camping Gear', 'Tents, sleeping bags, camping equipment', 50.00, 150.00, 'limited_responsibility'),
    ('Musical Instruments', 'Guitars, keyboards, amplifiers', 150.00, 400.00, 'full_responsibility'),
    ('Books', 'Textbooks, novels, comics', NULL, 20.00, 'trust_based'),
    ('Board Games', 'Strategy games, party games, puzzles', 20.00, 50.00, 'trust_based'),
    ('Kitchen Appliances', 'Mixers, blenders, specialized cookware', 50.00, 100.00, 'limited_responsibility'),
    ('Gardening Tools', 'Lawn mowers, trimmers, shovels', 40.00, 80.00, 'full_responsibility'),
    ('Party Supplies', 'Tents, tables, chairs, decorations', 30.00, 100.00, 'trust_based');

-- ================================================================
-- TEST DATA
-- ================================================================

-- Test user
INSERT INTO users (id, email, password_hash, first_name, last_name, current_location, email_verified) VALUES 
    ('1111-1111-1111-1111', 'alice@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrJYPUqXk9Yh5YyQZT9YkYnKqZqZqZq', 
        'Alice', 'Smith', ST_SetSRID(ST_MakePoint(15.9819, 45.8150), 4326), true);

-- Test item
INSERT INTO items (id, owner_id, category_id, name, description, current_location, condition_id, estimated_repair_cost, estimated_value, default_damage_policy_id, max_loan_days) VALUES 
    ('1111-1111-1111-1111', '11111111-1111-1111-1111-111111111111', 
        'power_tools', 'Bosch Power Drill', 'Professional 750W drill, great condition', 
        ST_SetSRID(ST_MakePoint(15.9825, 45.8160), 4326), 'good', 75.00, 150.00, 'full_responsibility', 7);