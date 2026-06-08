-- =========================================================
-- SEED DATA
-- =========================================================

INSERT INTO damage_policies (id, name, description) VALUES
('trust_based', 'Trust Based', 'Users resolve issues mutually'),
('full_responsibility', 'Full Responsibility', 'Borrower covers all damage');

INSERT INTO loan_statuses (id, name) VALUES
('borrowing_requested', 'Borrowing Requested'),
('terms_proposed', 'Terms Proposed'),
('awaiting_pickup', 'Awaiting Pickup'),
('active', 'Active'),
('returned', 'Returned'),
('completed', 'Completed'),
('cancelled', 'Cancelled');

INSERT INTO item_conditions (id, name, rating) VALUES
('excellent', 'Excellent', 5),
('very_good', 'Very Good', 4),
('good', 'Good', 3),
('fair', 'Fair', 2),
('poor', 'Poor', 1),
('broken', 'Broken', 0);

INSERT INTO location_sources (id, name, description) VALUES
('manual', 'Manual', 'Location was entered manually'),
('google_maps', 'Google Maps', 'Location was resolved from Google Maps'),
('openstreetmap', 'OpenStreetMap', 'Location was resolved from OpenStreetMap or Nominatim');

INSERT INTO countries (id, name, country_code) VALUES
('33333333-3333-3333-3333-333333333333', 'Slovenia', 'SI');

INSERT INTO localities (
    id,
    country_id,
    name,
    locality_type,
    region,
    municipality,
    postal_code,
    source_id,
    external_id,
    metadata
) VALUES
('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333333', 'Maribor', 'city', 'Styria', 'Maribor', '2000', 'manual', NULL, '{}'::jsonb),
('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333333', 'Hoce-Slivnica', 'municipality', 'Styria', 'Hoce-Slivnica', '2311', 'manual', NULL, '{}'::jsonb),
('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 'Miklavz na Dravskem Polju', 'municipality', 'Styria', 'Miklavz na Dravskem Polju', '2204', 'manual', NULL, '{}'::jsonb),
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Duplek', 'municipality', 'Styria', 'Duplek', '2241', 'manual', NULL, '{}'::jsonb),
('44444444-4444-4444-4444-444444444445', '33333333-3333-3333-3333-333333333333', 'Pesnica', 'municipality', 'Styria', 'Pesnica', '2211', 'manual', NULL, '{}'::jsonb),
('44444444-4444-4444-4444-444444444446', '33333333-3333-3333-3333-333333333333', 'Race-Fram', 'municipality', 'Styria', 'Race-Fram', '2327', 'manual', NULL, '{}'::jsonb);

INSERT INTO users (
    id,
    username,
    email,
    first_name,
    last_name,
    password_hash,
    current_location
) VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'john_doe',
        'john@example.com',
        'John',
        'Doe',
        'hashed_password_1',
        ST_SetSRID(ST_MakePoint(15.6459, 46.5547), 4326)
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'alice_smith',
        'alice@example.com',
        'Alice',
        'Smith',
        'hashed_password_2',
        ST_SetSRID(ST_MakePoint(15.6500, 46.5600), 4326)
    );

INSERT INTO items (
    id,
    owner_id,
    category_id,
    condition_id,
    default_damage_policy_id,
    name,
    description,
    images,
	weight,
	length,
	width,
	height,
    current_location,
    estimated_value,
    available,
    metadata
) VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        NULL,
        'good',
        'trust_based',
        'Canon DSLR Camera',
        'High quality DSLR for photography',
        ARRAY['https://example.com/cam1.jpg', 'https://example.com/cam2.jpg'],
		5.0,
		5.0,
		5.0,
		5.0,
        ST_SetSRID(ST_MakePoint(15.6459, 46.5547), 4326),
        499.99,
        true,
        '{"category":"electronics","brand":"Canon"}'::jsonb
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '22222222-2222-2222-2222-222222222222',
        NULL,
        'poor',
        'full_responsibility',
        'Mountain Bike',
        'Lightweight trail bike',
        ARRAY['https://example.com/bike.jpg'],
		40.0,
		25.0,
		100.0,
		75.0,
        ST_SetSRID(ST_MakePoint(15.6500, 46.5600), 4326),
        299.50,
        true,
        '{"category":"sports","type":"bike"}'::jsonb
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '11111111-1111-1111-1111-111111111111',
        NULL,
        'fair',
        'full_responsibility',
        'Camping Tent',
        '4-person waterproof camping tent',
        ARRAY['https://example.com/tent1.jpg'],
		20.0,
		100.0,
		100.0,
		100.0,
        ST_SetSRID(ST_MakePoint(13.7290, 45.5469), 4326),
        120.00,
        true,
        '{"category":"outdoors","season":"summer"}'::jsonb
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        '11111111-1111-1111-1111-111111111111',
        NULL,
        'good',
        'trust_based',
        'Electric Guitar',
        'Fender-style electric guitar with amp support',
        ARRAY['https://example.com/guitar1.jpg'],
		15.0,
		50.0,
		25.0,
		10.0,
        ST_SetSRID(ST_MakePoint(16.3619, 48.2082), 4326),
        300.00,
        true,
        '{"category":"music","instrument":"guitar"}'::jsonb
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        '11111111-1111-1111-1111-111111111111',
        NULL,
        'good',
        'full_responsibility',
        'Gaming Laptop',
        'High performance laptop for gaming and development',
        ARRAY['https://example.com/laptop1.jpg'],
		7.5,
		20.0,
		15.0,
		3.0,
        ST_SetSRID(ST_MakePoint(14.4378, 50.0755), 4326),
        1200.00,
        true,
        '{"category":"electronics","gpu":"RTX"}'::jsonb
    ),
    (
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        '11111111-1111-1111-1111-111111111111',
        NULL,
        'broken',
        'trust_based',
        'Road Bicycle',
        'Lightweight road bike for city commuting',
        ARRAY['https://example.com/roadbike.jpg'],
		40.0,
		25.0,
		100.0,
		75.0,
        ST_SetSRID(ST_MakePoint(15.9819, 46.8011), 4326),
        600.00,
        true,
        '{"category":"sports","type":"road-bike"}'::jsonb
    );

INSERT INTO locations (
    id,
    locality_id,
    location,
    location_type,
    address,
    source_id,
    metadata
)
VALUES (
    '55555555-5555-5555-5555-555555555551',
    '44444444-4444-4444-4444-444444444441',
    ST_SetSRID(ST_MakePoint(15.6520, 46.5530), 4326),
    'mall',
    'Pobreska cesta 18, 2000 Maribor',
    'manual',
    '{"label":"Europark Maribor"}'::jsonb
),
(
    '55555555-5555-5555-5555-555555555552',
    '44444444-4444-4444-4444-444444444441',
    ST_SetSRID(ST_MakePoint(15.6469, 46.5590), 4326),
    'transit_station',
    'Partizanska cesta 50, 2000 Maribor',
    'manual',
    '{"label":"Maribor Bus Station"}'::jsonb
);

INSERT INTO locker_stations (
    id,
    location_id,
    station_name,
    working_times
) VALUES
(
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    'Europark Locker Station',
    '{"monday":"00:00-24:00","tuesday":"00:00-24:00","wednesday":"00:00-24:00","thursday":"00:00-24:00","friday":"00:00-24:00","saturday":"00:00-24:00","sunday":"00:00-24:00"}'::jsonb
),
(
    '66666666-6666-6666-6666-666666666662',
    '55555555-5555-5555-5555-555555555552',
    'Maribor Center Locker Station',
    '{"monday":"06:00-22:00","tuesday":"06:00-22:00","wednesday":"06:00-22:00","thursday":"06:00-22:00","friday":"06:00-22:00","saturday":"08:00-20:00","sunday":"08:00-20:00"}'::jsonb
);

INSERT INTO lockers (
    id,
    station_id,
    box_number,
    max_weight,
    max_length,
    max_width,
    max_height,
    available,
    last_maintenance
) VALUES
(
    '77777777-7777-7777-7777-777777777771',
    '66666666-6666-6666-6666-666666666661',
    1,
    10.0,
    45.0,
    35.0,
    25.0,
    true,
    '2026-05-01'
),
(
    '77777777-7777-7777-7777-777777777772',
    '66666666-6666-6666-6666-666666666661',
    2,
    25.0,
    80.0,
    50.0,
    50.0,
    true,
    '2026-05-01'
),
(
    '77777777-7777-7777-7777-777777777773',
    '66666666-6666-6666-6666-666666666662',
    1,
    5.0,
    35.0,
    25.0,
    20.0,
    false,
    '2026-04-15'
);