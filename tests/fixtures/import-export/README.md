# Import/Export Test Fixtures

Test data files for QA testing of the Import/Export foundation feature (BMAD-QA-001).

## Files

### 1. sample-products.csv (15 records)
**Purpose**: Valid product data for testing successful import flow

**Data**: 15 Sentia non-alcoholic beverage products across categories:
- Spirits (Gin)
- Wine (Red, White, Rosé, Sparkling)
- Beer (Craft, IPA, Lager)
- Mixers (Cocktail mixers, Tonic waters)
- Gifts (Gift boxes)
- Seasonal (Limited editions)

**Use Cases**:
- Test successful CSV import
- Test column auto-mapping (exact match)
- Test validation passing
- Test progress tracking for medium dataset
- Test results download

**Expected Result**: 15/15 succeeded, 0 failed

### 2. sample-products-with-errors.csv (10 records)
**Purpose**: Invalid product data for testing validation error handling

**Errors Included**:
- Row 2: Missing required field (productName)
- Row 3: Negative price (-18.99)
- Row 4: Invalid data type (stock quantity = "abc")
- Row 5: Invalid category value
- Row 6: Business rule violation (reorder point > stock) - WARNING
- Row 8: Missing required field (productCode)
- Row 9: Negative stock quantity
- Row 10: Missing optional field (supplier) - WARNING

**Use Cases**:
- Test validation error detection
- Test error message clarity
- Test error report download
- Test filtering by error type
- Test warnings vs errors
- Test "proceed with warnings" flow

**Expected Result**:
- 5 errors (rows 2, 3, 4, 5, 8, 9)
- 2 warnings (rows 6, 10)
- 3 succeeded (rows 1, 7, valid data)

### 3. sample-orders.json (3 records)
**Purpose**: Valid order data for testing JSON import

**Data**: 3 orders from different channels:
- Shopify UK (PENDING status)
- Shopify USA (PROCESSING status)
- Amazon UK (SHIPPED status)

**Use Cases**:
- Test JSON format import
- Test nested object handling (items array)
- Test different data structure
- Test channel-specific data
- Test status enumeration

**Expected Result**: 3/3 succeeded, 0 failed

## Test Scenarios by File

### Scenario 1: Successful CSV Import (sample-products.csv)
```
1. Upload sample-products.csv
2. Select data type: PRODUCTS
3. Verify auto-mapping: All columns mapped with >95% confidence
4. Run validation: All pass
5. Start import: 15/15 succeeded
6. Download results: Verify all 15 records in database
```

### Scenario 2: Validation Error Handling (sample-products-with-errors.csv)
```
1. Upload sample-products-with-errors.csv
2. Select data type: PRODUCTS
3. Run validation: 5 errors, 2 warnings detected
4. View error list: Row numbers and descriptions shown
5. Download error report: CSV with error details
6. Option 1: Fix and re-upload
7. Option 2: Proceed with warnings (3 records imported)
```

### Scenario 3: JSON Import (sample-orders.json)
```
1. Upload sample-orders.json
2. Select data type: ORDERS
3. Map fields including nested items array
4. Run validation: All pass
5. Start import: 3/3 succeeded
6. Verify nested data handled correctly
```

## Performance Benchmarks

| File | Records | Expected Upload Time | Expected Validation Time | Expected Import Time |
|------|---------|---------------------|-------------------------|---------------------|
| sample-products.csv | 15 | < 1s | < 1s | < 2s |
| sample-products-with-errors.csv | 10 | < 1s | < 1s | < 2s (3 valid) |
| sample-orders.json | 3 | < 1s | < 1s | < 1s |

## Adding New Test Files

To create additional test fixtures:

1. **Naming Convention**: `sample-[entity]-[variant].csv|json|xlsx`
   - Entity: products, orders, customers, suppliers, inventory
   - Variant: valid, errors, large, special-chars, etc.

2. **File Size Recommendations**:
   - Small: 10-50 records (quick tests)
   - Medium: 100-500 records (performance tests)
   - Large: 1,000-5,000 records (stress tests)
   - Max: 50MB file size limit

3. **Required Documentation**:
   - Purpose statement
   - Expected results
   - Use cases
   - Error types (if error testing file)

## Related BMAD Story

**Story**: BMAD-QA-001 - Import/Export QA Testing & Integration
**Test Suite**: Functional Testing (File Upload, Column Mapping, Validation, Progress)
**Location**: [bmad/stories/2025-10-import-export-qa-testing.md](../../../bmad/stories/2025-10-import-export-qa-testing.md)

---

**Created**: 2025-10-18
**Framework**: BMAD-METHOD v6a
**Phase**: Phase 3 Testing & Integration
