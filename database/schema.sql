-- =========================================================
-- EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- REFERENCE TABLES
-- =========================================================

CREATE TABLE damage_policies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE loan_statuses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE item_conditions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    metadata_schema JSONB DEFAULT '{}'::jsonb
);

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,

    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,

    password_hash TEXT NOT NULL,

    current_location GEOMETRY(POINT, 4326),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ITEMS
-- =========================================================

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

    condition_id TEXT REFERENCES item_conditions(id),

    default_damage_policy_id TEXT REFERENCES damage_policies(id),

    name TEXT NOT NULL,
    description TEXT,

    images TEXT[],

    current_location GEOMETRY(POINT, 4326) NOT NULL,

    estimated_value DECIMAL(10,2),

    available BOOLEAN DEFAULT true,

    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- LOANS
-- =========================================================

CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,

    lender_id UUID NOT NULL REFERENCES users(id),

    borrower_id UUID NOT NULL REFERENCES users(id),

    status TEXT NOT NULL REFERENCES loan_statuses(id),

    agreed_damage_policy_id TEXT REFERENCES damage_policies(id),

    start_date TIMESTAMP,
    expected_return_date TIMESTAMP,
    actual_return_date TIMESTAMP,

    condition_on_borrow_id TEXT REFERENCES item_conditions(id),
    condition_on_return_id TEXT REFERENCES item_conditions(id),

    notes TEXT,

    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT different_parties CHECK (lender_id != borrower_id)
);


CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name TEXT NOT NULL,

    location_type TEXT,

    location GEOMETRY(POINT, 4326) NOT NULL,

    source TEXT DEFAULT 'manual',

    metadata JSONB DEFAULT '{}'::jsonb
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_users_location
ON users USING GIST(current_location);

CREATE INDEX idx_items_location
ON items USING GIST(current_location);

CREATE INDEX idx_items_owner
ON items(owner_id);

CREATE INDEX idx_loans_item
ON loans(item_id);

CREATE INDEX idx_loans_lender
ON loans(lender_id);

CREATE INDEX idx_loans_borrower
ON loans(borrower_id);

CREATE INDEX idx_locations_geom
ON locations USING GIST(location)

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
BEFORE UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

