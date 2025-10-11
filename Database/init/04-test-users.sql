-- Sample test users for login
-- These users can be used for testing the login functionality

-- Insert test staff members
INSERT INTO staff (
    user_id,
    full_name,
    designation,
    mobile,
    email,
    password_hash,
    user_role,
    is_first_time,
    is_active
) VALUES
-- Admin user
('admin', 'Dr. Rajdeep Sandhu', 'Veterinary Officer', '+919834562107', 'rajdeep.sandhu@ahpunjab.gov.in', 'admin123', 'Super_Admin', FALSE, TRUE),

-- Doctor user
('doctor1', 'Dr. Manpreet Kaur', 'Senior Veterinary Officer', '+919872041356', 'manpreet.kaur@ahpunjab.gov.in', 'doctor123', 'INAPH', FALSE, TRUE),

-- AI Worker
('aiw001', 'Arvinder Singh', 'Private AI Worker', '+919798125463', 'arvinder.singh@ahpunjab.gov.in', 'aiw123', 'AIW', FALSE, TRUE)

ON CONFLICT (user_id) DO NOTHING;

-- Note: In production, password_hash should use Argon2id hashing
-- For testing, we're using plain text passwords: admin123, doctor123, aiw123
