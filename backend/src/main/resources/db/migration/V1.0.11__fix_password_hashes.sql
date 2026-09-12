-- Migration V1.0.11: Fix BCrypt password hash for admin and seeded test users
-- Valid BCrypt hash for "admin123": $2a$10$bfirXkKsyNtYW7jQTZ5Hs.DPw2bQUJl6AEPxbzEw0zEKgLjLo1NUa

UPDATE users
SET password_hash = '$2a$10$bfirXkKsyNtYW7jQTZ5Hs.DPw2bQUJl6AEPxbzEw0zEKgLjLo1NUa'
WHERE username = 'admin'
   OR password_hash = '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6.yEPJFLZUU9jf56';
