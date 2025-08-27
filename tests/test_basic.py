import unittest
import sys
import os

# Add the project root to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

class TestBasicFunctionality(unittest.TestCase):
    """Basic functionality tests that don't require pandas or database"""
    
    def test_import_basic_modules(self):
        """Test that basic modules can be imported"""
        try:
            import config
            from app.models import User, Job, Resource, Schedule
            self.assertTrue(True, "Basic modules imported successfully")
        except ImportError as e:
            self.fail(f"Failed to import basic modules: {e}")
    
    def test_config_loading(self):
        """Test that configuration can be loaded"""
        try:
            from config import config, DevelopmentConfig
            self.assertIsNotNone(config)
            self.assertIn('development', config)
            self.assertEqual(config['development'], DevelopmentConfig)
            self.assertTrue(True, "Configuration loaded successfully")
        except Exception as e:
            self.fail(f"Failed to load configuration: {e}")
    
    def test_basic_app_creation(self):
        """Test basic app creation without data_import routes"""
        try:
            # Mock pandas to avoid import error
            import sys
            import types
            
            # Create mock pandas module
            pandas_mock = types.ModuleType('pandas')
            sys.modules['pandas'] = pandas_mock
            
            # Create mock numpy module  
            numpy_mock = types.ModuleType('numpy')
            sys.modules['numpy'] = numpy_mock
            
            from app import create_app
            from config import config
            
            # Create app with test config (doesn't use database)
            app = create_app(config.get('development'))
            self.assertIsNotNone(app)
            self.assertTrue(True, "App created successfully")
            
        except Exception as e:
            self.fail(f"Failed to create app: {e}")

if __name__ == '__main__':
    unittest.main()