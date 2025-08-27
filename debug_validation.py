#!/usr/bin/env python3
"""
Debug validation issues with mapped data.
"""

import os
import csv
import tempfile
from app import create_app, db
from app.utils.validation import create_product_validator

def test_validation_directly():
    """Test validation directly on mapped data"""
    print("DEBUGGING VALIDATION")
    print("=" * 30)
    
    app = create_app()
    
    with app.app_context():
        # Create validator
        validator = create_product_validator()
        
        # Test data similar to what we're creating
        test_rows = [
            {
                'sku': '43752682291450',
                'name': 'Drug Science Donation',
                'category': 'Gift Cards',
                'market_region': 'UK',
                'weight_kg': None,
                'unit_cost': None,
                'selling_price': 5.0,
                'is_active': True
            },
            {
                'sku': 'Sentia2001',
                'name': 'GABA Black 50cl',
                'category': 'GABA Products',
                'market_region': 'UK',
                'weight_kg': 1.25,
                'unit_cost': 6.0,
                'selling_price': 32.0,
                'is_active': True
            }
        ]
        
        for i, row in enumerate(test_rows, 1):
            print(f"Testing row {i}: {row['name']}")
            
            # Test validation
            result = validator.validate_row(row, i)
            
            print(f"  Valid: {result.is_valid}")
            print(f"  Errors: {len(result.errors)}")
            print(f"  Warnings: {len(result.warnings)}")
            
            if result.errors:
                print("  Error details:")
                for error in result.errors:
                    print(f"    - {error.field_name}: {error.message}")
                    print(f"      Original: {error.original_value}")
            
            if result.warnings:
                print("  Warning details:")
                for warning in result.warnings:
                    print(f"    - {warning.field_name}: {warning.message}")
            
            print()

def main():
    test_validation_directly()

if __name__ == '__main__':
    main()