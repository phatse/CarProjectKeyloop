-- Mock upstream data.
--
-- These two schemas simulate the Sales and Service systems. They are owned by
-- those systems, not by this service: the API can only read them over HTTP
-- (ADR-0003). Re-running this file resets both schemas to a known state.

DROP SCHEMA IF EXISTS sales_system CASCADE;
DROP SCHEMA IF EXISTS service_system CASCADE;

CREATE SCHEMA sales_system;
CREATE SCHEMA service_system;

-- Sales system: different column names than Service on purpose, so the adapter
-- has real normalisation work to do.
CREATE TABLE sales_system.document (
  id         text PRIMARY KEY,
  vin        varchar(17) NOT NULL,
  doc_type   text NOT NULL CHECK (doc_type IN ('CONTRACT', 'INVOICE', 'WARRANTY')),
  title      text NOT NULL,
  signed_on  date NOT NULL,
  amount     numeric(12,2),
  currency   char(3),
  file_url   text
);

CREATE INDEX idx_sales_document_vin ON sales_system.document (vin);

CREATE TABLE service_system.document (
  id            text PRIMARY KEY,
  vin           varchar(17) NOT NULL,
  kind          text NOT NULL CHECK (kind IN ('SERVICE_ORDER', 'INSPECTION', 'REPAIR_ESTIMATE')),
  label         text NOT NULL,
  performed_on  date NOT NULL,
  total         numeric(12,2),
  link          text
);

CREATE INDEX idx_service_document_vin ON service_system.document (vin);

-- Seed matrix: each VIN exercises one behaviour.
--   1HGCM82633A004352  both sources, 3 + 3   happy path
--   2T1BURHE0JC123456  sales only, 2 + 0     single-source result
--   3VWFE21C04M000001  none, 0 + 0           valid VIN, no documents
--   4T1BF1FK5GU123789  both, 1 + 1           partial failure (mock ?delay=5000)
--   5YJSA1E26HF000337  both, same invoice    cross-source duplicate, not merged

INSERT INTO sales_system.document (id, vin, doc_type, title, signed_on, amount, currency, file_url)
VALUES
  ('SL-2024-001', '1HGCM82633A004352', 'CONTRACT', 'Vehicle Purchase Agreement', '2024-03-12', 28500.00, 'USD', 'https://sales.example.com/docs/SL-2024-001.pdf'),
  ('SL-2024-002', '1HGCM82633A004352', 'INVOICE',  'Deposit Invoice',            '2024-03-12',  5000.00, 'USD', 'https://sales.example.com/docs/SL-2024-002.pdf'),
  ('SL-2024-003', '1HGCM82633A004352', 'WARRANTY', '3-Year Extended Warranty',   '2024-03-12',  1200.00, 'USD', 'https://sales.example.com/docs/SL-2024-003.pdf'),
  ('SL-2023-101', '2T1BURHE0JC123456', 'CONTRACT', 'Vehicle Purchase Agreement', '2023-11-02', 19900.00, 'USD', 'https://sales.example.com/docs/SL-2023-101.pdf'),
  ('SL-2023-102', '2T1BURHE0JC123456', 'INVOICE',  'Final Invoice',              '2023-11-02', 19900.00, 'USD', 'https://sales.example.com/docs/SL-2023-102.pdf'),
  ('SL-2024-009', '4T1BF1FK5GU123789', 'INVOICE',  'Service Invoice',            '2024-06-18',   740.00, 'USD', 'https://sales.example.com/docs/SL-2024-009.pdf'),
  ('SL-2024-010', '5YJSA1E26HF000337', 'INVOICE',  'Vehicle Sale Invoice',       '2024-01-09', 52000.00, 'USD', 'https://sales.example.com/docs/SL-2024-010.pdf');

INSERT INTO service_system.document (id, vin, kind, label, performed_on, total, link)
VALUES
  ('SVC-88213', '1HGCM82633A004352', 'SERVICE_ORDER',   '10,000 km Service',           '2024-08-20', 340.00, 'https://service.example.com/o/88213'),
  ('SVC-88214', '1HGCM82633A004352', 'INSPECTION',      'Annual Safety Inspection',    '2024-09-01',  75.00, 'https://service.example.com/o/88214'),
  ('SVC-88215', '1HGCM82633A004352', 'REPAIR_ESTIMATE', 'Brake Pad Replacement',       '2024-10-11', 960.00, 'https://service.example.com/o/88215'),
  ('SVC-88220', '4T1BF1FK5GU123789', 'SERVICE_ORDER',   'Oil Change',                  '2024-07-02', 120.00, 'https://service.example.com/o/88220'),
  ('SVC-88230', '5YJSA1E26HF000337', 'SERVICE_ORDER',   'Vehicle Sale Invoice (copy)', '2024-01-09', 52000.00, 'https://service.example.com/o/88230');
