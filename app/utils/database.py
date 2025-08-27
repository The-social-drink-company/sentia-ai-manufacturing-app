import logging
import traceback
from datetime import datetime, timezone, date
from typing import Optional, Dict, Any, List
from sqlalchemy import text, inspect
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from flask import current_app
from app import db
from app.models import (
    User, Product, Market, SalesChannel, HistoricalSales,
    Forecast, InventoryLevel, WorkingCapital, SystemSettings
)

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Database utility class for managing connections, migrations, and operations"""
    
    @staticmethod
    def test_connection() -> Dict[str, Any]:
        """Test database connection and return status"""
        try:
            # Test basic connection
            result = db.session.execute(text('SELECT 1')).fetchone()
            if result and result[0] == 1:
                # Get database info (different for different databases)
                database_version = 'Unknown'
                try:
                    # Try PostgreSQL version query first
                    db_info = db.session.execute(text('SELECT version()')).fetchone()
                    database_version = db_info[0] if db_info else 'PostgreSQL (version unknown)'
                except Exception:
                    # Fallback for SQLite
                    try:
                        db_info = db.session.execute(text('SELECT sqlite_version()')).fetchone()
                        database_version = f'SQLite {db_info[0]}' if db_info else 'SQLite (version unknown)'
                    except Exception:
                        # Get engine dialect info as final fallback
                        database_version = f'{db.engine.dialect.name} (version unknown)'
                
                return {
                    'status': 'success',
                    'connected': True,
                    'database_version': database_version,
                    'database_url': str(db.engine.url).split('@')[0] + '@***' if '@' in str(db.engine.url) else 'local',
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            else:
                return {
                    'status': 'error',
                    'connected': False,
                    'error': 'Connection test failed',
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
        except Exception as e:
            logger.error(f"Database connection test failed: {str(e)}")
            return {
                'status': 'error',
                'connected': False,
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    @staticmethod
    def get_table_info() -> Dict[str, Any]:
        """Get information about database tables"""
        try:
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            table_info = {}
            for table in tables:
                columns = inspector.get_columns(table)
                indexes = inspector.get_indexes(table)
                foreign_keys = inspector.get_foreign_keys(table)
                
                table_info[table] = {
                    'columns': len(columns),
                    'column_details': [
                        {
                            'name': col['name'],
                            'type': str(col['type']),
                            'nullable': col['nullable'],
                            'primary_key': col.get('primary_key', False)
                        }
                        for col in columns
                    ],
                    'indexes': len(indexes),
                    'foreign_keys': len(foreign_keys)
                }
            
            return {
                'status': 'success',
                'table_count': len(tables),
                'tables': table_info,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to get table info: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    @staticmethod
    def create_all_tables():
        """Create all database tables"""
        try:
            db.create_all()
            logger.info("All database tables created successfully")
            return {'status': 'success', 'message': 'All tables created'}
        except Exception as e:
            logger.error(f"Failed to create tables: {str(e)}")
            db.session.rollback()
            return {'status': 'error', 'error': str(e)}
    
    @staticmethod
    def drop_all_tables():
        """Drop all database tables (use with caution!)"""
        try:
            db.drop_all()
            logger.warning("All database tables dropped")
            return {'status': 'success', 'message': 'All tables dropped'}
        except Exception as e:
            logger.error(f"Failed to drop tables: {str(e)}")
            return {'status': 'error', 'error': str(e)}

class DataSeeder:
    """Class for seeding database with initial data"""
    
    @staticmethod
    def seed_basic_data() -> Dict[str, Any]:
        """Seed database with basic operational data"""
        try:
            results = {}
            
            # Seed markets
            markets_created = DataSeeder._seed_markets()
            results['markets'] = markets_created
            
            # Seed products
            products_created = DataSeeder._seed_products()
            results['products'] = products_created
            
            # Seed sales channels
            channels_created = DataSeeder._seed_sales_channels()
            results['sales_channels'] = channels_created
            
            # Seed system settings
            settings_created = DataSeeder._seed_system_settings()
            results['system_settings'] = settings_created
            
            # Seed admin user
            admin_created = DataSeeder._seed_admin_user()
            results['admin_user'] = admin_created
            
            db.session.commit()
            
            return {
                'status': 'success',
                'message': 'Basic data seeded successfully',
                'results': results,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to seed basic data: {str(e)}")
            db.session.rollback()
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    @staticmethod
    def _seed_markets() -> int:
        """Seed market data"""
        markets_data = [
            {
                'code': 'UK',
                'name': 'United Kingdom',
                'region': 'Europe',
                'currency_code': 'GBP',
                'tax_rate': 0.20,
                'standard_shipping_days': 2,
                'express_shipping_days': 1
            },
            {
                'code': 'EU',
                'name': 'European Union',
                'region': 'Europe',
                'currency_code': 'EUR',
                'tax_rate': 0.19,
                'standard_shipping_days': 5,
                'express_shipping_days': 3
            },
            {
                'code': 'USA',
                'name': 'United States',
                'region': 'North America',
                'currency_code': 'USD',
                'tax_rate': 0.08,
                'standard_shipping_days': 7,
                'express_shipping_days': 3
            }
        ]
        
        created_count = 0
        for market_data in markets_data:
            existing = Market.get_by_code(market_data['code'])
            if not existing:
                market = Market(**market_data)
                db.session.add(market)
                created_count += 1
        
        return created_count
    
    @staticmethod
    def _seed_products() -> int:
        """Seed product data"""
        products_data = [
            # GABA Red products
            {'sku': 'GABA-RED-UK-001', 'name': 'GABA Red UK', 'category': 'GABA Red', 'market_region': 'UK', 
             'unit_cost': 15.00, 'selling_price': 29.99, 'production_time_hours': 2.5},
            {'sku': 'GABA-RED-EU-001', 'name': 'GABA Red EU', 'category': 'GABA Red', 'market_region': 'EU', 
             'unit_cost': 16.50, 'selling_price': 34.99, 'production_time_hours': 2.5},
            {'sku': 'GABA-RED-USA-001', 'name': 'GABA Red USA', 'category': 'GABA Red', 'market_region': 'USA', 
             'unit_cost': 17.00, 'selling_price': 39.99, 'production_time_hours': 2.5},
            
            # GABA Black products
            {'sku': 'GABA-BLACK-UK-001', 'name': 'GABA Black UK', 'category': 'GABA Black', 'market_region': 'UK', 
             'unit_cost': 18.00, 'selling_price': 39.99, 'production_time_hours': 3.0},
            {'sku': 'GABA-BLACK-EU-001', 'name': 'GABA Black EU', 'category': 'GABA Black', 'market_region': 'EU', 
             'unit_cost': 19.50, 'selling_price': 44.99, 'production_time_hours': 3.0},
            {'sku': 'GABA-BLACK-USA-001', 'name': 'GABA Black USA', 'category': 'GABA Black', 'market_region': 'USA', 
             'unit_cost': 20.00, 'selling_price': 49.99, 'production_time_hours': 3.0},
            
            # GABA Gold products
            {'sku': 'GABA-GOLD-UK-001', 'name': 'GABA Gold UK', 'category': 'GABA Gold', 'market_region': 'UK', 
             'unit_cost': 25.00, 'selling_price': 59.99, 'production_time_hours': 4.0},
            {'sku': 'GABA-GOLD-EU-001', 'name': 'GABA Gold EU', 'category': 'GABA Gold', 'market_region': 'EU', 
             'unit_cost': 26.50, 'selling_price': 64.99, 'production_time_hours': 4.0},
            {'sku': 'GABA-GOLD-USA-001', 'name': 'GABA Gold USA', 'category': 'GABA Gold', 'market_region': 'USA', 
             'unit_cost': 27.00, 'selling_price': 69.99, 'production_time_hours': 4.0},
        ]
        
        created_count = 0
        for product_data in products_data:
            existing = Product.get_by_sku(product_data['sku'])
            if not existing:
                product = Product(**product_data)
                db.session.add(product)
                created_count += 1
        
        return created_count
    
    @staticmethod
    def _seed_sales_channels() -> int:
        """Seed sales channel data"""
        channels_data = [
            {
                'name': 'Amazon UK',
                'channel_type': 'Amazon',
                'market_code': 'UK',
                'commission_rate': 0.15,
                'fulfillment_method': 'FBA'
            },
            {
                'name': 'Amazon USA',
                'channel_type': 'Amazon',
                'market_code': 'USA',
                'commission_rate': 0.15,
                'fulfillment_method': 'FBA'
            },
            {
                'name': 'Shopify UK',
                'channel_type': 'Shopify',
                'market_code': 'UK',
                'commission_rate': 0.029,
                'fulfillment_method': 'Own'
            },
            {
                'name': 'Shopify EU',
                'channel_type': 'Shopify',
                'market_code': 'EU',
                'commission_rate': 0.029,
                'fulfillment_method': 'Own'
            },
            {
                'name': 'Shopify USA',
                'channel_type': 'Shopify',
                'market_code': 'USA',
                'commission_rate': 0.029,
                'fulfillment_method': 'Own'
            }
        ]
        
        created_count = 0
        for channel_data in channels_data:
            existing = SalesChannel.query.filter_by(
                name=channel_data['name'],
                market_code=channel_data['market_code']
            ).first()
            if not existing:
                channel = SalesChannel(**channel_data)
                db.session.add(channel)
                created_count += 1
        
        return created_count
    
    @staticmethod
    def _seed_system_settings() -> int:
        """Seed system settings"""
        settings_data = [
            {
                'category': 'forecast',
                'key': 'default_horizon_days',
                'name': 'Default Forecast Horizon',
                'description': 'Default number of days to forecast ahead',
                'value': 90,
                'data_type': 'integer'
            },
            {
                'category': 'forecast',
                'key': 'confidence_threshold',
                'name': 'Forecast Confidence Threshold',
                'description': 'Minimum confidence score to approve forecasts',
                'value': 0.75,
                'data_type': 'decimal'
            },
            {
                'category': 'inventory',
                'key': 'low_stock_threshold_days',
                'name': 'Low Stock Threshold',
                'description': 'Days of supply below which stock is considered low',
                'value': 7,
                'data_type': 'integer'
            },
            {
                'category': 'inventory',
                'key': 'reorder_safety_factor',
                'name': 'Reorder Safety Factor',
                'description': 'Safety factor for automatic reorder calculations',
                'value': 1.5,
                'data_type': 'decimal'
            },
            {
                'category': 'integration',
                'key': 'api_sync_frequency',
                'name': 'API Sync Frequency',
                'description': 'Frequency in minutes for API synchronization',
                'value': 60,
                'data_type': 'integer'
            }
        ]
        
        created_count = 0
        for setting_data in settings_data:
            existing = SystemSettings.get_setting(
                setting_data['category'],
                setting_data['key']
            )
            if not existing:
                setting = SystemSettings.set_setting(
                    category=setting_data['category'],
                    key=setting_data['key'],
                    value=setting_data['value'],
                    data_type=setting_data['data_type'],
                    name=setting_data['name'],
                    description=setting_data['description']
                )
                created_count += 1
        
        return created_count
    
    @staticmethod
    def _seed_admin_user() -> bool:
        """Create default admin user"""
        try:
            existing_admin = User.query.filter_by(role='admin').first()
            if existing_admin:
                return False
            
            admin_user = User(
                username='admin',
                email='admin@sentia-manufacturing.com',
                first_name='System',
                last_name='Administrator',
                role='admin',
                is_active=True
            )
            admin_user.set_password('ChangeMe123!')  # Default password - should be changed
            
            db.session.add(admin_user)
            return True
        except Exception as e:
            logger.error(f"Failed to create admin user: {str(e)}")
            return False

class DatabaseBackup:
    """Class for database backup and restore operations"""
    
    @staticmethod
    def export_table_data(table_name: str, limit: Optional[int] = None) -> Dict[str, Any]:
        """Export data from a specific table"""
        try:
            # Get the model class based on table name
            model_mapping = {
                'users': User,
                'products': Product,
                'markets': Market,
                'sales_channels': SalesChannel,
                'historical_sales': HistoricalSales,
                'forecasts': Forecast,
                'inventory_levels': InventoryLevel,
                'working_capital': WorkingCapital,
                'system_settings': SystemSettings
            }
            
            model_class = model_mapping.get(table_name)
            if not model_class:
                return {
                    'status': 'error',
                    'error': f'Unknown table: {table_name}'
                }
            
            query = model_class.query
            if limit:
                query = query.limit(limit)
            
            records = query.all()
            data = []
            
            for record in records:
                if hasattr(record, 'to_dict'):
                    data.append(record.to_dict())
                else:
                    # Fallback for models without to_dict method
                    record_dict = {}
                    for column in record.__table__.columns:
                        value = getattr(record, column.name)
                        if isinstance(value, (datetime, date)):
                            value = value.isoformat()
                        elif hasattr(value, '__str__'):
                            value = str(value)
                        record_dict[column.name] = value
                    data.append(record_dict)
            
            return {
                'status': 'success',
                'table': table_name,
                'record_count': len(data),
                'data': data,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to export table {table_name}: {str(e)}")
            return {
                'status': 'error',
                'table': table_name,
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    @staticmethod
    def get_database_stats() -> Dict[str, Any]:
        """Get database statistics"""
        try:
            stats = {}
            
            # Get row counts for each table
            model_mapping = {
                'users': User,
                'products': Product,
                'markets': Market,
                'sales_channels': SalesChannel,
                'historical_sales': HistoricalSales,
                'forecasts': Forecast,
                'inventory_levels': InventoryLevel,
                'working_capital': WorkingCapital,
                'system_settings': SystemSettings
            }
            
            for table_name, model_class in model_mapping.items():
                try:
                    count = model_class.query.count()
                    stats[table_name] = count
                except Exception as e:
                    stats[table_name] = f"Error: {str(e)}"
            
            return {
                'status': 'success',
                'table_counts': stats,
                'total_records': sum(v for v in stats.values() if isinstance(v, int)),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get database stats: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }