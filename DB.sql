CREATE DATABASE event_attendance;
USE event_attendance;

CREATE TABLE attendees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  contact_method ENUM('whatsapp', 'email') NOT NULL,
  contact_info VARCHAR(255) NOT NULL,
  guests INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_contact (contact_info)
);