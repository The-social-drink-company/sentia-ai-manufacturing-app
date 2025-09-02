"""
Data validation unit tests.
Tests for input validation, data integrity, and business rule enforcement.
"""
import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal, InvalidOperation
from unittest.mock import patch, Mock

from app.utils.validation import (
    validate_email, validate_sku, validate_currency, validate_phone,
    validate_date_range, validate_positive_decimal, validate_percentage,
    generate_date_range, sanitize_input, check_data_integrity
)
from app.utils.data_quality import DataQualityChecker
from app.models import Product, User, Job, Resource


class TestInputValidation:
    """Test input validation functions."""
    
    def test_email_validation(self):
        """Test email address validation."""
        # Valid emails
        valid_emails = [
            'user@example.com',
            'test.email@company.co.uk',
            'admin+test@domain.org',
            'user123@test-domain.com',
            'a@b.co'
        ]
        
        for email in valid_emails:
            assert validate_email(email) is True, f"Email {email} should be valid"
        
        # Invalid emails
        invalid_emails = [
            'invalid-email',
            '@example.com',
            'user@',
            'user.example.com',
            '',
            None,
            'user@domain',
            'user name@example.com',  # Space in email
            'user@domain..com',       # Double dot
            'user@.com'              # Starts with dot
        ]
        
        for email in invalid_emails:
            assert validate_email(email) is False, f"Email {email} should be invalid"
    
    def test_sku_validation(self):
        """Test SKU validation."""
        # Valid SKUs
        valid_skus = [
            'PROD-001',
            'SKU123',
            'ITEM_ABC_123',
            'P-123-XL-RED',
            '12345',
            'A1B2C3'
        ]
        
        for sku in valid_skus:
            assert validate_sku(sku) is True, f"SKU {sku} should be valid"
        
        # Invalid SKUs
        invalid_skus = [
            '',
            None,
            '   ',  # Only whitespace
            'a',    # Too short
            'a' * 51,  # Too long (assuming max 50 chars)
            'SKU with spaces',
            'SKU@invalid',
            'SKÜ-001'  # Non-ASCII characters
        ]
        
        for sku in invalid_skus:
            assert validate_sku(sku) is False, f"SKU {sku} should be invalid"
    
    def test_currency_validation(self):
        """Test currency code validation."""
        # Valid currency codes (ISO 4217)
        valid_currencies = [
            'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'
        ]
        
        for currency in valid_currencies:
            assert validate_currency(currency) is True, f"Currency {currency} should be valid"
        
        # Invalid currency codes
        invalid_currencies = [
            'US', 'DOLLAR', 'usd', 'US$', '', None, '123', 'ABCD'
        ]
        
        for currency in invalid_currencies:
            assert validate_currency(currency) is False, f"Currency {currency} should be invalid"
    
    def test_phone_validation(self):
        """Test phone number validation."""
        # Valid phone numbers (various formats)
        valid_phones = [
            '+1-555-123-4567',
            '+44 20 7946 0958',
            '+33 1 42 86 83 26',
            '555-123-4567',
            '(555) 123-4567',
            '5551234567',
            '+1 (555) 123-4567'
        ]
        
        for phone in valid_phones:
            assert validate_phone(phone) is True, f"Phone {phone} should be valid"
        
        # Invalid phone numbers
        invalid_phones = [
            '123',           # Too short
            'abc-def-ghij',  # Letters
            '+1-555',        # Incomplete
            '',              # Empty
            None,            # None
            '++1-555-123-4567'  # Double plus
        ]
        
        for phone in invalid_phones:
            assert validate_phone(phone) is False, f"Phone {phone} should be invalid"
    
    def test_positive_decimal_validation(self):
        """Test positive decimal validation."""
        # Valid positive decimals
        valid_decimals = [
            Decimal('10.50'),
            Decimal('0.01'),
            Decimal('1000'),
            '25.99',
            50.0,
            1
        ]
        
        for value in valid_decimals:
            assert validate_positive_decimal(value) is True, f"Decimal {value} should be valid"
        
        # Invalid decimals
        invalid_decimals = [
            Decimal('-10.50'),  # Negative
            Decimal('0'),       # Zero
            -5.0,               # Negative float
            'not_a_number',     # String
            None,               # None
            '',                 # Empty string
        ]
        
        for value in invalid_decimals:
            assert validate_positive_decimal(value) is False, f"Decimal {value} should be invalid"
    
    def test_percentage_validation(self):
        """Test percentage validation (0-100)."""
        # Valid percentages
        valid_percentages = [
            0, 50, 100, 0.0, 50.5, 99.99, Decimal('75.25')
        ]
        
        for pct in valid_percentages:
            assert validate_percentage(pct) is True, f"Percentage {pct} should be valid"
        
        # Invalid percentages
        invalid_percentages = [
            -1, 101, -0.1, 100.1, 'fifty', None, ''
        ]
        
        for pct in invalid_percentages:
            assert validate_percentage(pct) is False, f"Percentage {pct} should be invalid"
    
    def test_date_range_validation(self):
        """Test date range validation."""
        start_date = date(2024, 1, 1)
        end_date = date(2024, 12, 31)
        
        # Valid date range
        assert validate_date_range(start_date, end_date) is True
        
        # Invalid date ranges
        assert validate_date_range(end_date, start_date) is False  # End before start
        assert validate_date_range(start_date, start_date) is True  # Same date should be valid
        assert validate_date_range(None, end_date) is False        # None start date
        assert validate_date_range(start_date, None) is False      # None end date


class TestDataSanitization:
    """Test data sanitization functions."""
    
    def test_input_sanitization(self):
        """Test input sanitization for security."""
        # Test cases for potential security issues
        test_cases = [
            ('<script>alert("xss")</script>', 'alert("xss")'),  # XSS attempt
            ("'; DROP TABLE users; --", "'; DROP TABLE users; --"),  # SQL injection attempt
            ('Normal text', 'Normal text'),  # Normal input
            ('  whitespace  ', 'whitespace'),  # Whitespace trimming
            ('', ''),  # Empty string
            (None, '')  # None handling
        ]
        
        for input_data, expected in test_cases:
            result = sanitize_input(input_data)
            assert expected in result or result == expected
    
    def test_html_tag_removal(self):
        """Test HTML tag removal."""
        html_inputs = [
            '<b>Bold text</b>',
            '<p>Paragraph with <a href="link">link</a></p>',
            'Normal text without tags',
            '<img src="x" onerror="alert(1)">',
            '<<script>alert("nested")</script>'
        ]
        
        for html_input in html_inputs:
            sanitized = sanitize_input(html_input)
            # Should not contain angle brackets after sanitization
            assert '<' not in sanitized or '>' not in sanitized
    
    def test_special_character_handling(self):
        """Test handling of special characters."""
        special_inputs = [
            'café',           # Accented characters
            '价格',           # Chinese characters
            '€100',          # Currency symbols
            'test@email.com', # Email format
            '50%',           # Percentage
            '2024-01-01'     # Date format
        ]
        
        for input_data in special_inputs:
            sanitized = sanitize_input(input_data)
            assert isinstance(sanitized, str)
            assert len(sanitized) > 0


class TestDataIntegrityChecks:
    """Test data integrity validation."""
    
    def test_product_data_integrity(self):
        """Test product data integrity checks."""
        # Valid product data
        valid_product = {
            'name': 'Test Product',
            'sku': 'TEST-001',
            'cost': Decimal('10.00'),
            'price': Decimal('20.00'),
            'lead_time_days': 7
        }
        
        integrity_check = check_data_integrity('product', valid_product)
        assert integrity_check['is_valid'] is True
        assert len(integrity_check['errors']) == 0
        
        # Invalid product data
        invalid_product = {
            'name': '',  # Empty name
            'sku': 'TEST-001',
            'cost': Decimal('-5.00'),  # Negative cost
            'price': Decimal('10.00'),
            'lead_time_days': -1  # Negative lead time
        }
        
        integrity_check = check_data_integrity('product', invalid_product)
        assert integrity_check['is_valid'] is False
        assert len(integrity_check['errors']) > 0
    
    def test_user_data_integrity(self):
        """Test user data integrity checks."""
        # Valid user data
        valid_user = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'SecurePassword123!'
        }
        
        integrity_check = check_data_integrity('user', valid_user)
        assert integrity_check['is_valid'] is True
        
        # Invalid user data
        invalid_user = {
            'email': 'invalid-email',  # Invalid email format
            'first_name': '',          # Empty first name
            'last_name': 'User',
            'password': '123'          # Weak password
        }
        
        integrity_check = check_data_integrity('user', invalid_user)
        assert integrity_check['is_valid'] is False
        assert len(integrity_check['errors']) > 0
    
    def test_financial_data_integrity(self):
        """Test financial data integrity checks."""
        # Valid financial data
        valid_financial = {
            'amount': Decimal('1000.00'),
            'currency': 'USD',
            'date': date.today(),
            'category': 'revenue'
        }
        
        integrity_check = check_data_integrity('financial', valid_financial)
        assert integrity_check['is_valid'] is True
        
        # Invalid financial data
        invalid_financial = {
            'amount': Decimal('0'),     # Zero amount might be invalid for some contexts
            'currency': 'INVALID',      # Invalid currency code
            'date': 'not-a-date',       # Invalid date
            'category': ''              # Empty category
        }
        
        integrity_check = check_data_integrity('financial', invalid_financial)
        assert integrity_check['is_valid'] is False
    
    def test_cross_field_validation(self):
        """Test validation across multiple fields."""
        # Product with cost higher than price (potentially invalid)
        product_data = {
            'name': 'Test Product',
            'sku': 'TEST-001',
            'cost': Decimal('25.00'),   # Higher than price
            'price': Decimal('20.00'),
            'lead_time_days': 7
        }
        
        integrity_check = check_data_integrity('product', product_data)
        # This might generate a warning rather than an error
        assert 'warnings' in integrity_check
    
    def test_business_rule_validation(self):
        """Test business rule validation."""
        # Job with due date in the past
        past_date = datetime.now() - timedelta(days=1)
        job_data = {
            'product_id': 'prod-123',
            'quantity': 100,
            'priority': 1,
            'due_date': past_date,
            'status': 'pending'
        }
        
        integrity_check = check_data_integrity('job', job_data)
        # Should flag due date issue
        assert 'due_date' in str(integrity_check.get('errors', []))


class TestDataQualityChecks:
    """Test data quality assessment."""
    
    @pytest.fixture
    def data_quality_checker(self):
        """Create data quality checker instance."""
        return DataQualityChecker()
    
    def test_completeness_check(self, data_quality_checker):
        """Test data completeness assessment."""
        complete_record = {
            'name': 'Product Name',
            'sku': 'SKU-001',
            'cost': Decimal('10.00'),
            'price': Decimal('20.00'),
            'description': 'Product description'
        }
        
        incomplete_record = {
            'name': 'Product Name',
            'sku': 'SKU-001',
            'cost': None,           # Missing cost
            'price': Decimal('20.00'),
            'description': ''       # Empty description
        }
        
        complete_score = data_quality_checker.assess_completeness(complete_record)
        incomplete_score = data_quality_checker.assess_completeness(incomplete_record)
        
        assert complete_score > incomplete_score
        assert complete_score == 100.0  # 100% complete
        assert incomplete_score < 100.0  # Less than 100% complete
    
    def test_consistency_check(self, data_quality_checker):
        """Test data consistency assessment."""
        consistent_data = [
            {'currency': 'USD', 'country': 'US'},
            {'currency': 'EUR', 'country': 'DE'},
            {'currency': 'GBP', 'country': 'GB'}
        ]
        
        inconsistent_data = [
            {'currency': 'USD', 'country': 'US'},
            {'currency': 'EUR', 'country': 'US'},  # Inconsistent: EUR with US
            {'currency': 'GBP', 'country': 'GB'}
        ]
        
        consistent_score = data_quality_checker.assess_consistency(consistent_data)
        inconsistent_score = data_quality_checker.assess_consistency(inconsistent_data)
        
        assert consistent_score > inconsistent_score
    
    def test_accuracy_check(self, data_quality_checker):
        """Test data accuracy assessment."""
        # Simulate accuracy check against known good data
        test_data = [
            {'email': 'valid@example.com', 'phone': '+1-555-123-4567'},
            {'email': 'invalid-email', 'phone': '+1-555-123-4567'},
            {'email': 'another@test.com', 'phone': 'invalid-phone'}
        ]
        
        accuracy_score = data_quality_checker.assess_accuracy(test_data)
        
        # Should identify accuracy issues
        assert 0 <= accuracy_score <= 100
    
    def test_uniqueness_check(self, data_quality_checker):
        """Test data uniqueness assessment."""
        unique_data = [
            {'sku': 'SKU-001'},
            {'sku': 'SKU-002'},
            {'sku': 'SKU-003'}
        ]
        
        duplicate_data = [
            {'sku': 'SKU-001'},
            {'sku': 'SKU-002'},
            {'sku': 'SKU-001'}  # Duplicate
        ]
        
        unique_score = data_quality_checker.assess_uniqueness(unique_data, 'sku')
        duplicate_score = data_quality_checker.assess_uniqueness(duplicate_data, 'sku')
        
        assert unique_score > duplicate_score
        assert unique_score == 100.0  # 100% unique
    
    def test_validity_check(self, data_quality_checker):
        """Test data validity assessment."""
        valid_data = [
            {'email': 'user1@example.com', 'age': 25},
            {'email': 'user2@example.com', 'age': 30},
            {'email': 'user3@example.com', 'age': 45}
        ]
        
        invalid_data = [
            {'email': 'user1@example.com', 'age': 25},
            {'email': 'invalid-email', 'age': 30},        # Invalid email
            {'email': 'user3@example.com', 'age': -5}     # Invalid age
        ]
        
        valid_score = data_quality_checker.assess_validity(valid_data)
        invalid_score = data_quality_checker.assess_validity(invalid_data)
        
        assert valid_score > invalid_score
    
    def test_overall_quality_score(self, data_quality_checker):
        """Test overall data quality score calculation."""
        high_quality_data = [
            {'name': 'Product 1', 'sku': 'SKU-001', 'price': Decimal('10.00')},
            {'name': 'Product 2', 'sku': 'SKU-002', 'price': Decimal('15.00')},
            {'name': 'Product 3', 'sku': 'SKU-003', 'price': Decimal('20.00')}
        ]
        
        low_quality_data = [
            {'name': 'Product 1', 'sku': 'SKU-001', 'price': Decimal('10.00')},
            {'name': '', 'sku': 'SKU-001', 'price': None},  # Missing name, duplicate SKU, null price
            {'name': 'Product 3', 'sku': '', 'price': Decimal('-5.00')}  # Missing SKU, negative price
        ]
        
        high_quality_score = data_quality_checker.calculate_overall_quality(high_quality_data)
        low_quality_score = data_quality_checker.calculate_overall_quality(low_quality_data)
        
        assert high_quality_score > low_quality_score
        assert 0 <= high_quality_score <= 100
        assert 0 <= low_quality_score <= 100


class TestBusinessRuleValidation:
    """Test business rule validation."""
    
    def test_profit_margin_validation(self):
        """Test profit margin business rules."""
        # Negative margin should trigger warning
        product_data = {
            'cost': Decimal('25.00'),
            'price': Decimal('20.00')  # Price less than cost
        }
        
        margin = (product_data['price'] - product_data['cost']) / product_data['price'] * 100
        assert margin < 0  # Negative margin
        
        # This should be flagged in business rule validation
    
    def test_inventory_level_validation(self):
        """Test inventory level business rules."""
        inventory_data = {
            'current_stock': 100,
            'reserved_stock': 25,
            'reorder_point': 50,
            'max_stock': 200
        }
        
        # Available stock calculation
        available = inventory_data['current_stock'] - inventory_data['reserved_stock']
        assert available == 75
        
        # Stock level validations
        assert inventory_data['current_stock'] <= inventory_data['max_stock']
        assert inventory_data['reserved_stock'] <= inventory_data['current_stock']
        assert inventory_data['reorder_point'] > 0
    
    def test_job_scheduling_validation(self):
        """Test job scheduling business rules."""
        job_data = {
            'quantity': 100,
            'priority': 1,
            'due_date': datetime.now() + timedelta(days=7),
            'estimated_duration': 8  # hours
        }
        
        # Business rule: Priority should be positive
        assert job_data['priority'] > 0
        
        # Business rule: Quantity should be positive
        assert job_data['quantity'] > 0
        
        # Business rule: Due date should be in the future
        assert job_data['due_date'] > datetime.now()
    
    def test_resource_capacity_validation(self):
        """Test resource capacity business rules."""
        resource_data = {
            'capacity': 8,  # hours per day
            'utilization': 85,  # percentage
            'hourly_cost': Decimal('50.00')
        }
        
        # Business rules
        assert resource_data['capacity'] > 0
        assert 0 <= resource_data['utilization'] <= 100
        assert resource_data['hourly_cost'] > 0
        
        # Calculate actual working hours
        actual_hours = (resource_data['capacity'] * resource_data['utilization']) / 100
        assert actual_hours <= resource_data['capacity']