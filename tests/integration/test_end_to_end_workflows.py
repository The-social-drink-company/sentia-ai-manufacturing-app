"""
End-to-end workflow integration tests.
Tests complete business processes from start to finish.
"""
import pytest
import json
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch, Mock

from app.models import User, Product, Job, Resource, Schedule, HistoricalSales, Forecast
from app.services.forecasting_service import ForecastingService
from app.services.stock_optimization_service import StockOptimizationService
from app.services.constraint_solver import ConstraintSolver


class TestCompleteOrderFulfillmentWorkflow:
    """Test complete order fulfillment workflow - TC-E2E-001."""
    
    def test_order_to_delivery_workflow(self, client, db_session):
        """Test complete workflow from order creation to delivery."""
        # 1. Create user account
        user = User(email='workflow@example.com', first_name='Test', last_name='User')
        user.set_password('password123')
        db_session.add(user)
        
        # 2. Create product
        product = Product(
            name='Workflow Product',
            sku='WF-001',
            cost=Decimal('10.00'),
            price=Decimal('20.00'),
            lead_time_days=5
        )
        db_session.add(product)
        
        # 3. Create resource
        resource = Resource(
            name='Production Line 1',
            capacity=100,
            resource_type='machine',
            hourly_cost=Decimal('50.00')
        )
        db_session.add(resource)
        
        db_session.commit()
        
        # 4. Login user
        with client.session_transaction() as sess:
            sess['_user_id'] = str(user.id)
        
        # 5. Create manufacturing job via API
        job_data = {
            'product_id': str(product.id),
            'quantity': 50,
            'priority': 1,
            'due_date': (datetime.now() + timedelta(days=10)).isoformat()
        }
        
        response = client.post('/api/jobs',
                             data=json.dumps(job_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        job_response = json.loads(response.data)
        job_id = job_response.get('id')
        
        # 6. Schedule job on resource
        schedule_data = {
            'job_id': job_id,
            'resource_id': str(resource.id),
            'start_time': datetime.now().isoformat(),
            'end_time': (datetime.now() + timedelta(hours=8)).isoformat()
        }
        
        response = client.post('/api/schedules',
                             data=json.dumps(schedule_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        
        # 7. Update job status to in_progress
        update_data = {'status': 'in_progress'}
        response = client.put(f'/api/jobs/{job_id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        
        assert response.status_code in [200, 204]
        
        # 8. Complete job
        complete_data = {'status': 'completed'}
        response = client.put(f'/api/jobs/{job_id}',
                            data=json.dumps(complete_data),
                            content_type='application/json')
        
        assert response.status_code in [200, 204]
        
        # 9. Verify job completion
        response = client.get(f'/api/jobs/{job_id}')
        assert response.status_code == 200
        
        job_data = json.loads(response.data)
        assert job_data['status'] == 'completed'
    
    def test_inventory_replenishment_workflow(self, client, db_session, mock_external_apis):
        """Test inventory replenishment workflow."""
        # Setup test data
        user = User(email='inventory@example.com', first_name='Inv', last_name='User')
        user.set_password('password123')
        
        product = Product(
            name='Inventory Product',
            sku='INV-001',
            cost=Decimal('15.00'),
            price=Decimal('25.00'),
            lead_time_days=7
        )
        
        db_session.add_all([user, product])
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(user.id)
        
        # 1. Check current inventory levels
        response = client.get(f'/api/inventory/{product.id}')
        # Should return current inventory status
        
        # 2. Generate demand forecast
        forecast_data = {
            'product_id': str(product.id),
            'market_id': 'default',
            'days': 30
        }
        
        with patch('app.services.forecasting_service.ForecastingService.generate_simple_forecast') as mock_forecast:
            mock_forecast.return_value = {
                'forecast_dates': [(datetime.now() + timedelta(days=i)).date() for i in range(30)],
                'predicted_quantities': [20 + i for i in range(30)],
                'confidence_interval': 0.95
            }
            
            response = client.post('/api/forecasts',
                                 data=json.dumps(forecast_data),
                                 content_type='application/json')
            
            assert response.status_code in [200, 201]
        
        # 3. Calculate optimal stock levels
        with patch('app.services.stock_optimization_service.StockOptimizationService.calculate_optimal_stock_levels') as mock_optimize:
            mock_optimize.return_value = [
                {
                    'product_id': str(product.id),
                    'optimal_stock': 150,
                    'reorder_point': 75,
                    'safety_stock': 25
                }
            ]
            
            response = client.post('/api/optimization/stock')
            assert response.status_code == 200
        
        # 4. Create replenishment job if needed
        job_data = {
            'product_id': str(product.id),
            'quantity': 100,
            'priority': 2,
            'due_date': (datetime.now() + timedelta(days=14)).isoformat()
        }
        
        response = client.post('/api/jobs',
                             data=json.dumps(job_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]


class TestProductCreationToSchedulingWorkflow:
    """Test workflow from product creation to job scheduling - TC-E2E-002."""
    
    def test_complete_production_planning_workflow(self, client, db_session):
        """Test complete production planning workflow."""
        # Setup user
        user = User(email='planning@example.com', first_name='Plan', last_name='User')
        user.set_password('password123')
        db_session.add(user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(user.id)
        
        # 1. Create new product
        product_data = {
            'name': 'Planning Product',
            'sku': 'PLAN-001',
            'cost': 12.50,
            'price': 25.00,
            'lead_time_days': 10
        }
        
        response = client.post('/api/products',
                             data=json.dumps(product_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        product_response = json.loads(response.data)
        product_id = product_response.get('id')
        
        # 2. Create production resources
        resource_data = {
            'name': 'Assembly Line A',
            'capacity': 120,
            'resource_type': 'machine',
            'hourly_cost': 60.00
        }
        
        response = client.post('/api/resources',
                             data=json.dumps(resource_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        resource_response = json.loads(response.data)
        resource_id = resource_response.get('id')
        
        # 3. Create manufacturing job
        job_data = {
            'product_id': product_id,
            'quantity': 200,
            'priority': 1,
            'due_date': (datetime.now() + timedelta(days=15)).isoformat()
        }
        
        response = client.post('/api/jobs',
                             data=json.dumps(job_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        job_response = json.loads(response.data)
        job_id = job_response.get('id')
        
        # 4. Optimize production schedule
        with patch('app.services.constraint_solver.ConstraintSolver.optimize_schedule') as mock_optimize:
            mock_optimize.return_value = {
                'schedules': [{
                    'job_id': job_id,
                    'resource_id': resource_id,
                    'start_time': datetime.now().isoformat(),
                    'end_time': (datetime.now() + timedelta(hours=10)).isoformat()
                }],
                'total_makespan': 10,
                'resource_utilization': {resource_id: 85.0}
            }
            
            response = client.post('/api/optimization/schedule')
            assert response.status_code == 200
            
            schedule_data = json.loads(response.data)
            assert 'schedules' in schedule_data
            assert len(schedule_data['schedules']) > 0
        
        # 5. Apply optimized schedule
        schedule = schedule_data['schedules'][0]
        schedule_create_data = {
            'job_id': schedule['job_id'],
            'resource_id': schedule['resource_id'],
            'start_time': schedule['start_time'],
            'end_time': schedule['end_time']
        }
        
        response = client.post('/api/schedules',
                             data=json.dumps(schedule_create_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        
        # 6. Verify complete workflow
        response = client.get('/api/dashboard/production-overview')
        assert response.status_code == 200
        
        overview_data = json.loads(response.data)
        assert 'active_jobs' in overview_data
        assert 'resource_utilization' in overview_data


class TestForecastToOptimizationWorkflow:
    """Test workflow from forecast generation to optimization - TC-E2E-003."""
    
    def test_demand_driven_optimization_workflow(self, client, db_session):
        """Test demand-driven optimization workflow."""
        # Setup test data
        user = User(email='forecast@example.com', first_name='Fore', last_name='User')
        user.set_password('password123')
        
        product = Product(
            name='Forecast Product',
            sku='FORE-001',
            cost=Decimal('20.00'),
            price=Decimal('35.00'),
            lead_time_days=14
        )
        
        db_session.add_all([user, product])
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(user.id)
        
        # 1. Import historical sales data
        historical_data = []
        for i in range(365):  # One year of data
            date = datetime.now().date() - timedelta(days=365-i)
            historical_data.append({
                'product_id': str(product.id),
                'date': date.isoformat(),
                'quantity_sold': 20 + (i % 30),  # Seasonal pattern
                'revenue': str(Decimal('35.00') * (20 + (i % 30)))
            })
        
        response = client.post('/api/data-import/historical-sales',
                             data=json.dumps({'data': historical_data}),
                             content_type='application/json')
        
        # 2. Generate demand forecast
        forecast_data = {
            'product_id': str(product.id),
            'market_id': 'default',
            'days': 90,
            'method': 'seasonal'
        }
        
        with patch('app.services.forecasting_service.ForecastingService.generate_seasonal_forecast') as mock_forecast:
            mock_forecast.return_value = {
                'forecast_dates': [(datetime.now() + timedelta(days=i)).date() for i in range(90)],
                'predicted_quantities': [25 + (i % 20) for i in range(90)],
                'confidence_interval': 0.95,
                'seasonal_factors': [1.0 + 0.1 * (i % 7) for i in range(90)]
            }
            
            response = client.post('/api/forecasts',
                                 data=json.dumps(forecast_data),
                                 content_type='application/json')
            
            assert response.status_code in [200, 201]
            forecast_response = json.loads(response.data)
        
        # 3. Calculate optimal inventory levels based on forecast
        with patch('app.services.stock_optimization_service.StockOptimizationService.calculate_optimal_stock_levels') as mock_stock:
            mock_stock.return_value = [{
                'product_id': str(product.id),
                'optimal_stock': 500,
                'reorder_point': 200,
                'safety_stock': 100,
                'eoq': 150
            }]
            
            response = client.post('/api/optimization/stock')
            assert response.status_code == 200
            
            optimization_response = json.loads(response.data)
            assert len(optimization_response) > 0
        
        # 4. Generate production schedule based on forecast
        total_forecast_demand = sum(forecast_response.get('predicted_quantities', []))
        
        job_data = {
            'product_id': str(product.id),
            'quantity': total_forecast_demand,
            'priority': 1,
            'due_date': (datetime.now() + timedelta(days=85)).isoformat()  # Before forecast end
        }
        
        response = client.post('/api/jobs',
                             data=json.dumps(job_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        
        # 5. Validate forecast accuracy (simulation)
        with patch('app.services.forecasting_service.ForecastingService.validate_forecast_accuracy') as mock_validate:
            mock_validate.return_value = {
                'mape': 15.2,  # Mean Absolute Percentage Error
                'rmse': 5.8,   # Root Mean Square Error
                'accuracy_score': 84.8
            }
            
            response = client.get(f'/api/forecasts/{forecast_response.get("id", "test")}/accuracy')
            # Should return accuracy metrics


class TestMultiUserCollaborationWorkflow:
    """Test multi-user collaboration workflow - TC-E2E-008."""
    
    def test_collaborative_production_planning(self, client, db_session):
        """Test collaborative production planning between multiple users."""
        # Create multiple users with different roles
        planner = User(email='planner@example.com', first_name='Production', last_name='Planner')
        planner.set_password('password123')
        planner.role = 'planner'
        
        manager = User(email='manager@example.com', first_name='Production', last_name='Manager')
        manager.set_password('password123')
        manager.role = 'manager'
        
        operator = User(email='operator@example.com', first_name='Machine', last_name='Operator')
        operator.set_password('password123')
        operator.role = 'operator'
        
        db_session.add_all([planner, manager, operator])
        
        # Create shared resources
        product = Product(
            name='Collaborative Product',
            sku='COLLAB-001',
            cost=Decimal('30.00'),
            price=Decimal('50.00'),
            lead_time_days=12
        )
        
        resource = Resource(
            name='Shared Production Line',
            capacity=80,
            resource_type='machine',
            hourly_cost=Decimal('45.00')
        )
        
        db_session.add_all([product, resource])
        db_session.commit()
        
        # 1. Planner creates production job
        with client.session_transaction() as sess:
            sess['_user_id'] = str(planner.id)
        
        job_data = {
            'product_id': str(product.id),
            'quantity': 300,
            'priority': 1,
            'due_date': (datetime.now() + timedelta(days=20)).isoformat(),
            'created_by': str(planner.id)
        }
        
        response = client.post('/api/jobs',
                             data=json.dumps(job_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        job_response = json.loads(response.data)
        job_id = job_response.get('id')
        
        # 2. Manager reviews and approves job
        with client.session_transaction() as sess:
            sess['_user_id'] = str(manager.id)
        
        approval_data = {'status': 'approved', 'approved_by': str(manager.id)}
        response = client.put(f'/api/jobs/{job_id}/approval',
                            data=json.dumps(approval_data),
                            content_type='application/json')
        
        # 3. System optimizes schedule
        with patch('app.services.constraint_solver.ConstraintSolver.optimize_schedule') as mock_optimize:
            mock_optimize.return_value = {
                'schedules': [{
                    'job_id': job_id,
                    'resource_id': str(resource.id),
                    'start_time': datetime.now().isoformat(),
                    'end_time': (datetime.now() + timedelta(hours=15)).isoformat(),
                    'assigned_operator': str(operator.id)
                }],
                'total_makespan': 15,
                'resource_utilization': {str(resource.id): 90.0}
            }
            
            response = client.post('/api/optimization/schedule')
            assert response.status_code == 200
        
        # 4. Operator receives schedule assignment
        with client.session_transaction() as sess:
            sess['_user_id'] = str(operator.id)
        
        response = client.get('/api/schedules/my-assignments')
        assert response.status_code == 200
        
        assignments = json.loads(response.data)
        assert len(assignments) > 0
        
        # 5. Operator updates job progress
        progress_data = {
            'status': 'in_progress',
            'progress_percentage': 25,
            'notes': 'Started production, everything running smoothly'
        }
        
        response = client.put(f'/api/jobs/{job_id}/progress',
                            data=json.dumps(progress_data),
                            content_type='application/json')
        
        # 6. All users can view updated status
        for user in [planner, manager, operator]:
            with client.session_transaction() as sess:
                sess['_user_id'] = str(user.id)
            
            response = client.get('/api/dashboard/overview')
            assert response.status_code == 200
            
            dashboard_data = json.loads(response.data)
            # Should show updated job progress


class TestErrorRecoveryWorkflow:
    """Test error recovery workflow - TC-E2E-009."""
    
    def test_production_disruption_recovery(self, client, db_session):
        """Test recovery from production disruption."""
        # Setup
        user = User(email='recovery@example.com', first_name='Recovery', last_name='User')
        user.set_password('password123')
        
        product = Product(
            name='Recovery Product',
            sku='REC-001',
            cost=Decimal('25.00'),
            price=Decimal('40.00'),
            lead_time_days=8
        )
        
        primary_resource = Resource(
            name='Primary Production Line',
            capacity=100,
            resource_type='machine',
            hourly_cost=Decimal('55.00'),
            status='active'
        )
        
        backup_resource = Resource(
            name='Backup Production Line',
            capacity=80,
            resource_type='machine',
            hourly_cost=Decimal('60.00'),
            status='standby'
        )
        
        db_session.add_all([user, product, primary_resource, backup_resource])
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(user.id)
        
        # 1. Create critical job
        job_data = {
            'product_id': str(product.id),
            'quantity': 500,
            'priority': 1,
            'due_date': (datetime.now() + timedelta(days=7)).isoformat(),
            'is_critical': True
        }
        
        response = client.post('/api/jobs',
                             data=json.dumps(job_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        job_response = json.loads(response.data)
        job_id = job_response.get('id')
        
        # 2. Schedule on primary resource
        schedule_data = {
            'job_id': job_id,
            'resource_id': str(primary_resource.id),
            'start_time': datetime.now().isoformat(),
            'end_time': (datetime.now() + timedelta(hours=20)).isoformat()
        }
        
        response = client.post('/api/schedules',
                             data=json.dumps(schedule_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        schedule_response = json.loads(response.data)
        schedule_id = schedule_response.get('id')
        
        # 3. Simulate resource failure
        failure_data = {
            'resource_id': str(primary_resource.id),
            'status': 'failed',
            'failure_reason': 'Equipment malfunction',
            'estimated_repair_time': 48  # hours
        }
        
        response = client.post('/api/resources/failure',
                             data=json.dumps(failure_data),
                             content_type='application/json')
        
        # 4. Trigger automatic rescheduling
        with patch('app.services.constraint_solver.ConstraintSolver.reschedule_affected_jobs') as mock_reschedule:
            mock_reschedule.return_value = {
                'rescheduled_jobs': [{
                    'job_id': job_id,
                    'old_resource_id': str(primary_resource.id),
                    'new_resource_id': str(backup_resource.id),
                    'new_start_time': (datetime.now() + timedelta(hours=2)).isoformat(),
                    'new_end_time': (datetime.now() + timedelta(hours=25)).isoformat()
                }],
                'impact_assessment': {
                    'delayed_jobs': 1,
                    'additional_cost': 120.00,
                    'schedule_extension': 5  # hours
                }
            }
            
            response = client.post('/api/schedules/emergency-reschedule')
            assert response.status_code == 200
            
            reschedule_data = json.loads(response.data)
            assert len(reschedule_data['rescheduled_jobs']) > 0
        
        # 5. Notify stakeholders
        notification_data = {
            'type': 'production_disruption',
            'severity': 'high',
            'affected_jobs': [job_id],
            'message': 'Primary production line failed, job rescheduled to backup resource'
        }
        
        response = client.post('/api/notifications',
                             data=json.dumps(notification_data),
                             content_type='application/json')
        
        # 6. Track recovery progress
        response = client.get(f'/api/recovery/status/{job_id}')
        # Should return recovery status and timeline


class TestSystemIntegrationWorkflow:
    """Test system integration with external APIs - TC-E2E-005."""
    
    def test_external_api_integration_workflow(self, client, db_session, mock_external_apis):
        """Test integration with external APIs."""
        user = User(email='integration@example.com', first_name='API', last_name='User')
        user.set_password('password123')
        db_session.add(user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(user.id)
        
        # 1. Sync orders from Amazon
        with patch('app.services.amazon_sp_client.AmazonSPClient.get_orders') as mock_amazon:
            mock_amazon.return_value = [
                {
                    'order_id': 'AMZ-12345',
                    'items': [
                        {'sku': 'PROD-001', 'quantity': 5},
                        {'sku': 'PROD-002', 'quantity': 2}
                    ],
                    'order_date': datetime.now().isoformat()
                }
            ]
            
            response = client.post('/api/integrations/amazon/sync-orders')
            assert response.status_code == 200
        
        # 2. Sync inventory from Shopify
        with patch('app.services.shopify_client.ShopifyClient.get_inventory') as mock_shopify:
            mock_shopify.return_value = [
                {'sku': 'PROD-001', 'quantity': 100, 'location': 'Main Warehouse'},
                {'sku': 'PROD-002', 'quantity': 50, 'location': 'Main Warehouse'}
            ]
            
            response = client.post('/api/integrations/shopify/sync-inventory')
            assert response.status_code == 200
        
        # 3. Sync financial data from Xero
        with patch('app.services.xero_client.XeroClient.get_financial_data') as mock_xero:
            mock_xero.return_value = {
                'revenue': 50000.00,
                'expenses': 35000.00,
                'profit': 15000.00,
                'period': 'current_month'
            }
            
            response = client.post('/api/integrations/xero/sync-financials')
            assert response.status_code == 200
        
        # 4. Generate integrated dashboard
        response = client.get('/api/dashboard/integrated-overview')
        assert response.status_code == 200
        
        dashboard_data = json.loads(response.data)
        assert 'amazon_orders' in dashboard_data
        assert 'shopify_inventory' in dashboard_data
        assert 'financial_summary' in dashboard_data