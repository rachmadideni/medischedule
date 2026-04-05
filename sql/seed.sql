-- Seed doctors
INSERT INTO doctors (name, specialty, bio, email) VALUES
('Dr. Sarah Patel', 'Neurology', 'Board-certified neurologist specializing in headaches, migraines, seizures, and neurological disorders. 12 years of experience in diagnosing and treating conditions of the brain and nervous system.', 'sarah.patel@medischedule.com'),
('Dr. James Kim', 'General Practice', 'Family medicine physician providing comprehensive primary care including routine checkups, preventive care, acute illness treatment, and chronic disease management.', 'james.kim@medischedule.com'),
('Dr. Maria Rodriguez', 'Cardiology', 'Interventional cardiologist specializing in heart disease, chest pain, hypertension, arrhythmias, and cardiovascular health. Expert in cardiac catheterization and stent procedures.', 'maria.rodriguez@medischedule.com'),
('Dr. David Chen', 'Orthopedics', 'Orthopedic surgeon specializing in sports injuries, joint pain, fractures, back pain, and musculoskeletal conditions. Expertise in knee, hip, and shoulder reconstruction.', 'david.chen@medischedule.com'),
('Dr. Emily Watson', 'Dermatology', 'Dermatologist specializing in skin conditions, rashes, acne, eczema, psoriasis, skin cancer screening, and cosmetic dermatology procedures.', 'emily.watson@medischedule.com'),
('Dr. Michael Brown', 'Psychiatry', 'Psychiatrist specializing in anxiety, depression, PTSD, bipolar disorder, and mental health management. Offers both therapy and medication management.', 'michael.brown@medischedule.com'),
('Dr. Lisa Chang', 'Pediatrics', 'Pediatrician providing care for infants, children, and adolescents including wellness visits, vaccinations, developmental assessments, and childhood illness treatment.', 'lisa.chang@medischedule.com'),
('Dr. Robert Taylor', 'Gastroenterology', 'Gastroenterologist specializing in digestive disorders, stomach pain, IBS, acid reflux, liver disease, and colonoscopy procedures.', 'robert.taylor@medischedule.com');

-- Seed schedules (Monday-Friday for each doctor, varied hours)
-- Dr. Patel (Neurology) - Mon, Wed, Fri
INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time) VALUES
(1, 1, '09:00', '12:00'), (1, 1, '14:00', '17:00'),
(1, 3, '09:00', '12:00'), (1, 3, '14:00', '17:00'),
(1, 5, '09:00', '12:00');

-- Dr. Kim (General Practice) - Mon-Fri
INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time) VALUES
(2, 1, '08:00', '12:00'), (2, 1, '13:00', '16:00'),
(2, 2, '08:00', '12:00'), (2, 2, '13:00', '16:00'),
(2, 3, '08:00', '12:00'), (2, 3, '13:00', '16:00'),
(2, 4, '08:00', '12:00'), (2, 4, '13:00', '16:00'),
(2, 5, '08:00', '12:00');

-- Dr. Rodriguez (Cardiology) - Tue, Thu
INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time) VALUES
(3, 2, '09:00', '12:00'), (3, 2, '14:00', '17:00'),
(3, 4, '09:00', '12:00'), (3, 4, '14:00', '17:00');

-- Dr. Chen (Orthopedics) - Mon, Wed, Thu
INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time) VALUES
(4, 1, '10:00', '13:00'), (4, 1, '14:00', '17:00'),
(4, 3, '10:00', '13:00'), (4, 3, '14:00', '17:00'),
(4, 4, '10:00', '13:00');

-- Dr. Watson (Dermatology) - Tue, Wed, Fri
INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time) VALUES
(5, 2, '09:00', '12:00'), (5, 2, '13:00', '16:00'),
(5, 3, '09:00', '12:00'),
(5, 5, '09:00', '12:00'), (5, 5, '13:00', '16:00');

-- Dr. Brown (Psychiatry) - Mon, Tue, Thu, Fri
INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time) VALUES
(6, 1, '10:00', '13:00'), (6, 1, '14:00', '17:00'),
(6, 2, '10:00', '13:00'),
(6, 4, '10:00', '13:00'), (6, 4, '14:00', '17:00'),
(6, 5, '10:00', '13:00');

-- Dr. Chang (Pediatrics) - Mon-Thu
INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time) VALUES
(7, 1, '08:00', '12:00'), (7, 1, '13:00', '16:00'),
(7, 2, '08:00', '12:00'), (7, 2, '13:00', '16:00'),
(7, 3, '08:00', '12:00'),
(7, 4, '08:00', '12:00'), (7, 4, '13:00', '16:00');

-- Dr. Taylor (Gastroenterology) - Wed, Thu, Fri
INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time) VALUES
(8, 3, '09:00', '12:00'), (8, 3, '14:00', '17:00'),
(8, 4, '09:00', '12:00'), (8, 4, '14:00', '17:00'),
(8, 5, '09:00', '12:00');

-- Seed a sample patient
INSERT INTO patients (name, email, phone) VALUES
('John Doe', 'john.doe@example.com', '555-0100');

-- Generate doctor embeddings using AlloyDB google_ml_integration
UPDATE doctors
SET embedding = embedding('text-embedding-005', specialty || ' specialist. ' || COALESCE(bio, ''))::vector;
