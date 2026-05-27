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
          ST_SetSRID(ST_MakePoint(14.4378, 50.0755), 4326),
          1200.00,
          true,
          '{"category":"electronics","gpu":"RTX"}'::jsonb
      ),
      (
          'ffffffff-ffff-ffff-ffff-ffffffffffff',
          '11111111-1111-1111-1111-111111111111',
          NULL,
          'damaged',
          'trust_based',
          'Road Bicycle',
          'Lightweight road bike for city commuting',
          ARRAY['https://example.com/roadbike.jpg'],
          ST_SetSRID(ST_MakePoint(15.9819, 46.8011), 4326),
          600.00,
          true,
          '{"category":"sports","type":"road-bike"}'::jsonb
      );

INSERT INTO locations (
    name,
    location_type,
    location
)
VALUES (
    'Europark',
    'mall',
    ST_SetSRID(ST_MakePoint(15.652, 46.553), 4326)
);
