-- =========================================================
-- SEED DATA
-- =========================================================

INSERT INTO damage_policies (id, name, description) VALUES
('trust_based', 'Trust Based', 'Users resolve issues mutually'),
('full_responsibility', 'Full Responsibility', 'Borrower covers all damage');

INSERT INTO loan_statuses (id, name) VALUES
('pending', 'Pending'),
('active', 'Active'),
('returned', 'Returned'),
('completed', 'Completed'),
('cancelled', 'Cancelled');

INSERT INTO item_conditions (id, name) VALUES
('excellent', 'Excellent'),
('good', 'Good'),
('fair', 'Fair'),
('poor', 'Poor'),
('damaged', 'Damaged');

INSERT INTO users (
    id,
    email,
    username,
    first_name,
    last_name,
    password_hash,
    current_location,
    created_at,
    updated_at
)
VALUES (
    uuid_generate_v4(),
    'test@example.com',
    'testuser',
    'Test',
    'User',
    '$2a$10$abcdefghijklmnopqrstuv', -- fake bcrypt hash
    ST_SetSRID(ST_MakePoint(15.9819, 45.8150), 4326),
    NOW(),
    NOW()
);