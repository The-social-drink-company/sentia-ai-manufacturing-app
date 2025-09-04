-- Reference Data Seed Script - Global Readiness
-- Idempotent: Safe to run multiple times without duplicating data
-- Created: 2025-01-20

-- ================================================
-- CURRENCIES (ISO-4217)
-- ================================================
INSERT INTO currencies (code, name, symbol, decimal_places, is_active, created_at, updated_at)
VALUES 
  ('GBP', 'British Pound Sterling', '£', 2, true, now(), now()),
  ('EUR', 'Euro', '€', 2, true, now(), now()),
  ('USD', 'US Dollar', '$', 2, true, now(), now()),
  ('CAD', 'Canadian Dollar', 'C$', 2, true, now(), now()),
  ('AUD', 'Australian Dollar', 'A$', 2, true, now(), now()),
  ('JPY', 'Japanese Yen', '¥', 0, true, now(), now()),
  ('CHF', 'Swiss Franc', 'Fr.', 2, true, now(), now()),
  ('SEK', 'Swedish Krona', 'kr', 2, true, now(), now()),
  ('NOK', 'Norwegian Krone', 'kr', 2, true, now(), now()),
  ('DKK', 'Danish Krone', 'kr.', 2, true, now(), now())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  decimal_places = EXCLUDED.decimal_places,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ================================================
-- ENTITIES (Company Legal Entities)
-- ================================================
INSERT INTO entities (id, name, country_code, currency_code, tax_number, address, is_active, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Sentia Manufacturing UK Ltd', 'GB', 'GBP', 'GB123456789', 'Unit 15, Business Park, London SW1A 1AA, UK', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440001', 'Sentia Manufacturing EU B.V.', 'NL', 'EUR', 'NL123456789B01', 'Herengracht 123, 1015 BG Amsterdam, Netherlands', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Sentia Manufacturing USA LLC', 'US', 'USD', '12-3456789', '1234 Business Ave, Delaware 19901, USA', true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  country_code = EXCLUDED.country_code,
  currency_code = EXCLUDED.currency_code,
  tax_number = EXCLUDED.tax_number,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ================================================
-- VAT RATES (EU & UK)
-- ================================================
INSERT INTO vat_rates (id, country_code, rate_name, rate_pct, valid_from, created_at, updated_at)
VALUES 
  -- UK VAT Rates
  (gen_random_uuid(), 'GB', 'Standard', 0.2000, '2011-01-04', now(), now()),
  (gen_random_uuid(), 'GB', 'Reduced', 0.0500, '1997-09-01', now(), now()),
  (gen_random_uuid(), 'GB', 'Zero', 0.0000, '1973-01-01', now(), now()),
  
  -- Netherlands (EU HQ)
  (gen_random_uuid(), 'NL', 'Standard', 0.2100, '2012-10-01', now(), now()),
  (gen_random_uuid(), 'NL', 'Reduced', 0.0900, '2019-01-01', now(), now()),
  (gen_random_uuid(), 'NL', 'Zero', 0.0000, '1973-01-01', now(), now()),
  
  -- Germany (Major EU Market)
  (gen_random_uuid(), 'DE', 'Standard', 0.1900, '2007-01-01', now(), now()),
  (gen_random_uuid(), 'DE', 'Reduced', 0.0700, '1983-07-01', now(), now()),
  
  -- France (Major EU Market)
  (gen_random_uuid(), 'FR', 'Standard', 0.2000, '2014-01-01', now(), now()),
  (gen_random_uuid(), 'FR', 'Reduced', 0.1000, '2014-01-01', now(), now()),
  (gen_random_uuid(), 'FR', 'Super Reduced', 0.0550, '2012-01-01', now(), now()),
  
  -- Ireland
  (gen_random_uuid(), 'IE', 'Standard', 0.2300, '2012-01-01', now(), now()),
  (gen_random_uuid(), 'IE', 'Reduced', 0.1350, '2003-01-01', now(), now())
ON CONFLICT (country_code, rate_name, valid_from) DO NOTHING;

-- ================================================
-- US SALES TAX RATES (Major States)
-- ================================================
INSERT INTO sales_tax_us (id, state_code, locality, rate_pct, valid_from, created_at, updated_at)
VALUES 
  -- Major E-commerce States
  (gen_random_uuid(), 'CA', NULL, 0.0725, '2017-04-01', now(), now()), -- California
  (gen_random_uuid(), 'NY', NULL, 0.0800, '2008-06-01', now(), now()), -- New York
  (gen_random_uuid(), 'TX', NULL, 0.0625, '1961-09-01', now(), now()), -- Texas
  (gen_random_uuid(), 'FL', NULL, 0.0600, '1949-01-01', now(), now()), -- Florida
  (gen_random_uuid(), 'WA', NULL, 0.0650, '1935-05-01', now(), now()), -- Washington
  (gen_random_uuid(), 'NV', NULL, 0.0685, '1955-07-01', now(), now()), -- Nevada
  (gen_random_uuid(), 'IL', NULL, 0.0625, '1933-08-01', now(), now()), -- Illinois
  (gen_random_uuid(), 'PA', NULL, 0.0600, '1956-05-01', now(), now()), -- Pennsylvania
  (gen_random_uuid(), 'OH', NULL, 0.0575, '1934-08-01', now(), now()), -- Ohio
  (gen_random_uuid(), 'NC', NULL, 0.0475, '1933-05-01', now(), now()), -- North Carolina
  
  -- Zero Tax States
  (gen_random_uuid(), 'DE', NULL, 0.0000, '1776-07-04', now(), now()), -- Delaware
  (gen_random_uuid(), 'MT', NULL, 0.0000, '1889-11-08', now(), now()), -- Montana
  (gen_random_uuid(), 'NH', NULL, 0.0000, '1776-07-04', now(), now()), -- New Hampshire
  (gen_random_uuid(), 'OR', NULL, 0.0000, '1859-02-14', now(), now())  -- Oregon
ON CONFLICT (state_code, locality, valid_from) DO NOTHING;

-- ================================================
-- IMPORT PROVENANCE (Regulatory Tracking)
-- ================================================
INSERT INTO import_provenance (id, shipment_reference, origin_country, destination_country, product_category, duty_rate, compliance_status, created_at, updated_at)
VALUES 
  -- Sample provenance records for common supply chain routes
  (gen_random_uuid(), 'SAMPLE-UK-001', 'CN', 'GB', 'supplements', 0.0250, 'COMPLIANT', now(), now()),
  (gen_random_uuid(), 'SAMPLE-EU-001', 'CN', 'NL', 'supplements', 0.0350, 'COMPLIANT', now(), now()),
  (gen_random_uuid(), 'SAMPLE-US-001', 'CN', 'US', 'supplements', 0.0450, 'COMPLIANT', now(), now()),
  (gen_random_uuid(), 'SAMPLE-UK-002', 'IN', 'GB', 'raw_materials', 0.0150, 'COMPLIANT', now(), now()),
  (gen_random_uuid(), 'SAMPLE-EU-002', 'IN', 'NL', 'raw_materials', 0.0200, 'COMPLIANT', now(), now())
ON CONFLICT (shipment_reference) DO UPDATE SET
  compliance_status = EXCLUDED.compliance_status,
  updated_at = now();

-- ================================================
-- SAMPLE FX RATES (Current as of 2025-01-20)
-- ================================================
INSERT INTO fx_rates (id, as_of_date, base_code, quote_code, rate, source, created_at)
VALUES 
  -- GBP Base Rates
  (gen_random_uuid(), CURRENT_DATE, 'GBP', 'USD', 1.2450, 'ecb', now()),
  (gen_random_uuid(), CURRENT_DATE, 'GBP', 'EUR', 1.1950, 'ecb', now()),
  (gen_random_uuid(), CURRENT_DATE, 'GBP', 'CAD', 1.7850, 'ecb', now()),
  (gen_random_uuid(), CURRENT_DATE, 'GBP', 'JPY', 195.75, 'ecb', now()),
  
  -- USD Base Rates
  (gen_random_uuid(), CURRENT_DATE, 'USD', 'GBP', 0.8032, 'ecb', now()),
  (gen_random_uuid(), CURRENT_DATE, 'USD', 'EUR', 0.9598, 'ecb', now()),
  (gen_random_uuid(), CURRENT_DATE, 'USD', 'CAD', 1.4342, 'ecb', now()),
  (gen_random_uuid(), CURRENT_DATE, 'USD', 'JPY', 157.25, 'ecb', now()),
  
  -- EUR Base Rates  
  (gen_random_uuid(), CURRENT_DATE, 'EUR', 'GBP', 0.8368, 'ecb', now()),
  (gen_random_uuid(), CURRENT_DATE, 'EUR', 'USD', 1.0419, 'ecb', now()),
  (gen_random_uuid(), CURRENT_DATE, 'EUR', 'CAD', 1.4942, 'ecb', now()),
  (gen_random_uuid(), CURRENT_DATE, 'EUR', 'JPY', 163.85, 'ecb', now())
ON CONFLICT (as_of_date, base_code, quote_code) DO UPDATE SET
  rate = EXCLUDED.rate,
  source = EXCLUDED.source;

-- ================================================
-- VERIFICATION QUERIES
-- ================================================
-- Verify seeded data counts
DO $$
DECLARE
  currency_count INT;
  entity_count INT;
  vat_count INT;
  sales_tax_count INT;
  fx_rate_count INT;
  provenance_count INT;
BEGIN
  SELECT COUNT(*) INTO currency_count FROM currencies WHERE is_active = true;
  SELECT COUNT(*) INTO entity_count FROM entities WHERE is_active = true;
  SELECT COUNT(*) INTO vat_count FROM vat_rates WHERE valid_to IS NULL OR valid_to > CURRENT_DATE;
  SELECT COUNT(*) INTO sales_tax_count FROM sales_tax_us WHERE valid_to IS NULL OR valid_to > CURRENT_DATE;
  SELECT COUNT(*) INTO fx_rate_count FROM fx_rates WHERE as_of_date = CURRENT_DATE;
  SELECT COUNT(*) INTO provenance_count FROM import_provenance WHERE compliance_status = 'COMPLIANT';
  
  RAISE NOTICE 'Reference data seeded successfully:';
  RAISE NOTICE '  - Active currencies: %', currency_count;
  RAISE NOTICE '  - Active entities: %', entity_count;
  RAISE NOTICE '  - Current VAT rates: %', vat_count;
  RAISE NOTICE '  - Current US sales tax rates: %', sales_tax_count;
  RAISE NOTICE '  - Today FX rates: %', fx_rate_count;
  RAISE NOTICE '  - Compliant import records: %', provenance_count;
END $$;

-- ================================================
-- INDEXES VERIFICATION (Check if all expected indexes exist)
-- ================================================
DO $$
DECLARE
  index_count INT;
BEGIN
  SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%entity%' OR indexname LIKE '%currency%' OR indexname LIKE '%fx%';
  RAISE NOTICE 'Global readiness indexes created: %', index_count;
END $$;

-- ================================================
-- END OF SEED SCRIPT
-- ================================================