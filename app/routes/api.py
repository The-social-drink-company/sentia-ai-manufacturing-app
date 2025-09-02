from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from datetime import date, datetime, timedelta
import uuid, random
from app import db
from app.models.forecast import Forecast
from app.models.product import Product
from app.models.sales_channel import SalesChannel
from app.services.enhanced_forecasting_service import EnhancedForecastingService
from app.services.forecast_validation_service import ForecastValidationService
from app.services.stock_optimization_service import StockOptimizationService, ServiceLevel, OptimizationObjective, SupplyChainConstraints, CostParameters
from app.services.constraint_solver import InventoryConstraintSolver, MultiLocationConstraints
from app.services.supplier_performance_service import SupplierPerformanceService

bp = Blueprint('api', __name__, url_prefix='/api')

# Initialize services
forecasting_service = EnhancedForecastingService()
validation_service = ForecastValidationService()
stock_optimization_service = StockOptimizationService()
constraint_solver = InventoryConstraintSolver()
supplier_service = SupplierPerformanceService()

@bp.route('/health')
def health_check():
    """Enhanced health check endpoint with database and Redis connectivity."""
    try:
        # Check database connection
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        db_status = 'healthy'
    except Exception as e:
        current_app.logger.error(f"Database health check failed: {e}")
        db_status = 'unhealthy'
    
    # Check Redis connection (if configured)
    redis_status = 'not_configured'
    try:
        redis_url = current_app.config.get('REDIS_URL')
        if redis_url and not redis_url.startswith('redis://localhost'):
            import redis
            r = redis.from_url(redis_url)
            r.ping()
            redis_status = 'healthy'
        elif redis_url and redis_url.startswith('redis://localhost'):
            # Skip localhost Redis in production/Railway
            redis_status = 'skipped_localhost'
    except Exception as e:
        current_app.logger.error(f"Redis health check failed: {e}")
        redis_status = 'unhealthy'
    
    health_status = 'healthy' if db_status == 'healthy' else 'degraded'
    
    return jsonify({
        'status': health_status,
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat(),
        'database': db_status,
        'redis': redis_status,
        'message': 'API is running'
    })

@bp.route('/jobs', methods=['GET'])
def get_jobs():
    return jsonify({'jobs': []})

@bp.route('/schedule', methods=['GET'])
def get_schedule():
    return jsonify({'schedule': []})

@bp.route('/optimize', methods=['POST'])
def optimize_schedule():
    data = request.get_json()
    return jsonify({'status': 'success', 'message': 'Schedule optimization initiated'})

# === DASHBOARD ENDPOINTS ===

@bp.route('/dashboard/kpis', methods=['GET'])
@login_required
def get_dashboard_kpis():
    """Get KPI data for dashboard widgets."""
    try:
        time_range = request.args.get('timeRange', '7d')
        region = request.args.get('region', 'all')
        product = request.args.get('product', 'all')
        
        # Mock KPI data - in real implementation, query from database
        kpi_data = {
            'active_jobs': {
                'current': random.randint(5, 25),
                'change': round(random.uniform(-10, 15), 1)
            },
            'pending_jobs': {
                'current': random.randint(2, 18),
                'change': round(random.uniform(-5, 8), 1)
            },
            'completed_jobs': {
                'current': random.randint(20, 70),
                'change': round(random.uniform(-3, 12), 1)
            },
            'utilization': {
                'current': random.randint(70, 95),
                'change': round(random.uniform(-2, 5), 1)
            }
        }
        
        return jsonify(kpi_data)
        
    except Exception as e:
        current_app.logger.error(f"Error fetching KPI data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/dashboard/forecast', methods=['GET'])
@login_required
def get_dashboard_forecast():
    """Get demand forecast data for chart."""
    try:
        time_range = request.args.get('timeRange', '7d')
        region = request.args.get('region', 'all')
        product = request.args.get('product', 'all')
        
        # Generate mock forecast data based on time range
        days = {'1d': 1, '7d': 7, '30d': 30, '90d': 90, '1y': 365}.get(time_range, 7)
        
        labels = []
        actual_data = []
        forecast_data = []
        
        base_date = datetime.now() - timedelta(days=days)
        base_demand = 100
        
        for i in range(days):
            current_date = base_date + timedelta(days=i)
            labels.append(current_date.strftime('%Y-%m-%d'))
            
            # Simulate seasonal patterns and random variation
            seasonal_factor = 1 + 0.2 * (i % 7 - 3) / 7  # Weekly pattern
            trend_factor = 1 + 0.001 * i  # Slight upward trend
            noise = random.uniform(0.8, 1.2)
            
            actual = int(base_demand * seasonal_factor * trend_factor * noise)
            forecast = int(actual * random.uniform(0.95, 1.05))  # Forecast close to actual
            
            actual_data.append(actual)
            forecast_data.append(forecast)
        
        return jsonify({
            'labels': labels,
            'actual': actual_data,
            'forecast': forecast_data
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching forecast data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/dashboard/stock-levels', methods=['GET'])
@login_required
def get_dashboard_stock_levels():
    """Get stock level data for chart."""
    try:
        region = request.args.get('region', 'all')
        product_filter = request.args.get('product', 'all')
        
        products = ['GABA Red', 'GABA Black', 'GABA Gold']
        current_stock = []
        reorder_points = []
        safety_stock = []
        
        for product in products:
            if product_filter != 'all' and product_filter not in product.lower():
                continue
                
            current = random.randint(50, 500)
            reorder = int(current * 0.3)
            safety = int(reorder * 0.5)
            
            current_stock.append(current)
            reorder_points.append(reorder)
            safety_stock.append(safety)
        
        return jsonify({
            'products': products,
            'current': current_stock,
            'reorderPoint': reorder_points,
            'safetyStock': safety_stock
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching stock data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/dashboard/working-capital', methods=['GET'])
@login_required
def get_dashboard_working_capital():
    """Get working capital breakdown data."""
    try:
        region = request.args.get('region', 'all')
        
        # Mock working capital data
        total_capital = 1000000
        
        inventory = random.randint(250000, 450000)
        receivables = random.randint(150000, 350000)
        cash = random.randint(100000, 200000)
        payables = total_capital - inventory - receivables - cash
        
        return jsonify({
            'inventory': inventory,
            'receivables': receivables,
            'cash': cash,
            'payables': abs(payables)  # Ensure positive value
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching working capital data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/dashboard/capacity', methods=['GET'])
@login_required
def get_dashboard_capacity():
    """Get production capacity utilization data."""
    try:
        time_range = request.args.get('timeRange', '7d')
        
        resources = ['Production Line 1', 'Production Line 2', 'Packaging', 'Quality Control', 'Warehouse']
        utilization = []
        
        for resource in resources:
            # Simulate different utilization levels for different resources
            if 'Production' in resource:
                util = random.randint(75, 95)
            elif resource == 'Packaging':
                util = random.randint(60, 85)
            elif resource == 'Quality Control':
                util = random.randint(70, 90)
            else:
                util = random.randint(50, 80)
            
            utilization.append(util)
        
        return jsonify({
            'resources': resources,
            'utilization': utilization
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching capacity data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/dashboard/alerts', methods=['GET'])
@login_required
def get_dashboard_alerts():
    """Get current alerts and notifications."""
    try:
        alerts = []
        
        # Generate some mock alerts
        alert_types = [
            {'type': 'warning', 'message': 'GABA Red stock level below reorder point'},
            {'type': 'info', 'message': 'Production Line 2 scheduled maintenance in 2 days'},
            {'type': 'success', 'message': 'Weekly production target exceeded by 8%'},
            {'type': 'error', 'message': 'Quality check failed for batch GB-2024-001'}
        ]
        
        # Randomly select 1-3 alerts
        num_alerts = random.randint(1, 3)
        selected_alerts = random.sample(alert_types, num_alerts)
        
        for alert in selected_alerts:
            alerts.append({
                'id': str(uuid.uuid4()),
                'type': alert['type'],
                'message': alert['message'],
                'timestamp': datetime.now().isoformat(),
                'read': False
            })
        
        return jsonify({'alerts': alerts})
        
    except Exception as e:
        current_app.logger.error(f"Error fetching alerts: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/dashboard/recent-jobs', methods=['GET'])
@login_required
def get_recent_jobs():
    """Get recent manufacturing jobs."""
    try:
        limit = int(request.args.get('limit', 10))
        
        jobs = []
        products = ['GABA Red', 'GABA Black', 'GABA Gold']
        statuses = ['In Progress', 'Pending', 'Completed', 'On Hold']
        
        for i in range(limit):
            job_id = f"JOB-{random.randint(1000, 9999)}"
            product = random.choice(products)
            status = random.choice(statuses)
            progress = random.randint(0, 100) if status != 'Completed' else 100
            
            if status == 'Pending':
                progress = 0
            elif status == 'Completed':
                progress = 100
            
            started = datetime.now() - timedelta(hours=random.randint(1, 48))
            estimated_completion = started + timedelta(hours=random.randint(4, 12))
            
            jobs.append({
                'id': job_id,
                'product': product,
                'status': status,
                'progress': progress,
                'started': started.strftime('%Y-%m-%d %H:%M') if status != 'Pending' else None,
                'estimated_completion': estimated_completion.strftime('%Y-%m-%d %H:%M')
            })
        
        return jsonify({'jobs': jobs})
        
    except Exception as e:
        current_app.logger.error(f"Error fetching recent jobs: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# === FORECASTING ENDPOINTS ===

@bp.route('/forecast/generate', methods=['POST'])
@login_required
def generate_forecast():
    """Generate a comprehensive demand forecast."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['product_id', 'sales_channel_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}',
                    'status': 'error'
                }), 400
        
        # Extract parameters
        product_id = data['product_id']
        sales_channel_id = data['sales_channel_id']
        forecast_horizon = data.get('forecast_horizon', 30)
        algorithm = data.get('algorithm', 'auto')
        apply_seasonal = data.get('apply_seasonal', True)
        external_factors = data.get('external_factors', {})
        save_to_db = data.get('save_to_db', True)
        
        # Validate entities exist
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found', 'status': 'error'}), 404
            
        sales_channel = SalesChannel.query.get(sales_channel_id)
        if not sales_channel:
            return jsonify({'error': 'Sales channel not found', 'status': 'error'}), 404
        
        # Generate forecast
        result = forecasting_service.generate_comprehensive_forecast(
            product_id=product_id,
            sales_channel_id=sales_channel_id,
            forecast_horizon=forecast_horizon,
            algorithm=algorithm,
            apply_seasonal=apply_seasonal,
            external_factors=external_factors,
            save_to_db=save_to_db,
            created_by=str(current_user.id)
        )
        
        if 'error' in result:
            return jsonify(result), 500
        
        return jsonify({
            'status': 'success',
            'forecast': result
        })
        
    except Exception as e:
        current_app.logger.error(f"Error generating forecast: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error',
            'details': str(e)
        }), 500

@bp.route('/forecast/<forecast_id>', methods=['GET'])
@login_required
def get_forecast(forecast_id):
    """Get a specific forecast by ID."""
    try:
        forecast = Forecast.query.get(forecast_id)
        if not forecast:
            return jsonify({'error': 'Forecast not found', 'status': 'error'}), 404
        
        return jsonify({
            'status': 'success',
            'forecast': forecast.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching forecast: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/forecasts', methods=['GET'])
@login_required
def get_forecasts():
    """Get forecasts with optional filtering."""
    try:
        # Get query parameters
        product_id = request.args.get('product_id')
        sales_channel_id = request.args.get('sales_channel_id')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        status = request.args.get('status', 'active')
        
        # Build query
        query = Forecast.query.filter_by(status=status)
        
        if product_id:
            query = query.filter_by(product_id=product_id)
        if sales_channel_id:
            query = query.filter_by(sales_channel_id=sales_channel_id)
        
        # Apply pagination
        forecasts = query.order_by(Forecast.created_at.desc()).offset(offset).limit(limit).all()
        total_count = query.count()
        
        return jsonify({
            'status': 'success',
            'forecasts': [forecast.to_dict() for forecast in forecasts],
            'total_count': total_count,
            'limit': limit,
            'offset': offset
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching forecasts: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/forecast/validate/<forecast_id>', methods=['POST'])
@login_required
def validate_forecast(forecast_id):
    """Validate forecast accuracy against actual results."""
    try:
        result = validation_service.validate_forecast_accuracy(forecast_id)
        
        return jsonify({
            'status': 'success',
            'validation': result
        })
        
    except ValueError as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 400
    except Exception as e:
        current_app.logger.error(f"Error validating forecast: {str(e)}")
        return jsonify({
            'error': 'Internal server error', 
            'status': 'error'
        }), 500

@bp.route('/forecast/compare-models', methods=['POST'])
@login_required
def compare_forecast_models():
    """Compare performance of different forecasting models."""
    try:
        data = request.get_json()
        
        product_id = data.get('product_id')
        sales_channel_id = data.get('sales_channel_id')
        models = data.get('models')  # Optional
        validation_days = data.get('validation_days', 60)
        
        if not product_id or not sales_channel_id:
            return jsonify({
                'error': 'product_id and sales_channel_id are required',
                'status': 'error'
            }), 400
        
        result = validation_service.compare_models(
            product_id=product_id,
            sales_channel_id=sales_channel_id,
            models=models,
            validation_days=validation_days
        )
        
        return jsonify({
            'status': 'success',
            'comparison': result
        })
        
    except Exception as e:
        current_app.logger.error(f"Error comparing models: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/forecast/recommendations', methods=['POST'])
@login_required 
def get_forecast_recommendations():
    """Get personalized forecast recommendations."""
    try:
        data = request.get_json()
        
        product_id = data.get('product_id')
        sales_channel_id = data.get('sales_channel_id')
        
        if not product_id or not sales_channel_id:
            return jsonify({
                'error': 'product_id and sales_channel_id are required',
                'status': 'error'
            }), 400
        
        recommendations = forecasting_service.get_forecast_recommendations(
            product_id=product_id,
            sales_channel_id=sales_channel_id
        )
        
        return jsonify({
            'status': 'success',
            'recommendations': recommendations
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting recommendations: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/forecast/optimize-parameters', methods=['POST'])
@login_required
def optimize_forecast_parameters():
    """Optimize forecast parameters through systematic testing."""
    try:
        data = request.get_json()
        
        product_id = data.get('product_id')
        sales_channel_id = data.get('sales_channel_id')
        
        if not product_id or not sales_channel_id:
            return jsonify({
                'error': 'product_id and sales_channel_id are required',
                'status': 'error'
            }), 400
        
        optimization = forecasting_service.optimize_forecast_parameters(
            product_id=product_id,
            sales_channel_id=sales_channel_id
        )
        
        return jsonify({
            'status': 'success',
            'optimization': optimization
        })
        
    except Exception as e:
        current_app.logger.error(f"Error optimizing parameters: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/forecast/performance/<product_id>/<sales_channel_id>', methods=['GET'])
@login_required
def track_forecast_performance(product_id, sales_channel_id):
    """Track ongoing forecast performance."""
    try:
        tracking_days = int(request.args.get('tracking_days', 30))
        
        performance = validation_service.track_model_performance(
            product_id=product_id,
            sales_channel_id=sales_channel_id,
            tracking_period_days=tracking_days
        )
        
        return jsonify({
            'status': 'success',
            'performance': performance
        })
        
    except Exception as e:
        current_app.logger.error(f"Error tracking performance: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/forecast/<forecast_id>/approve', methods=['POST'])
@login_required
def approve_forecast(forecast_id):
    """Approve a forecast for use in planning."""
    try:
        forecast = Forecast.query.get(forecast_id)
        if not forecast:
            return jsonify({'error': 'Forecast not found', 'status': 'error'}), 404
        
        forecast.approve_forecast(current_user.id)
        
        return jsonify({
            'status': 'success',
            'message': 'Forecast approved successfully',
            'forecast_id': forecast_id
        })
        
    except Exception as e:
        current_app.logger.error(f"Error approving forecast: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/forecast/<forecast_id>/supersede', methods=['POST'])
@login_required
def supersede_forecast(forecast_id):
    """Supersede a forecast with a new one."""
    try:
        data = request.get_json()
        superseding_forecast_id = data.get('superseding_forecast_id')
        
        if not superseding_forecast_id:
            return jsonify({
                'error': 'superseding_forecast_id is required',
                'status': 'error'
            }), 400
        
        forecast = Forecast.query.get(forecast_id)
        if not forecast:
            return jsonify({'error': 'Forecast not found', 'status': 'error'}), 404
        
        forecast.supersede(superseding_forecast_id)
        
        return jsonify({
            'status': 'success',
            'message': 'Forecast superseded successfully',
            'original_forecast_id': forecast_id,
            'superseding_forecast_id': superseding_forecast_id
        })
        
    except Exception as e:
        current_app.logger.error(f"Error superseding forecast: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/forecast/bulk-generate', methods=['POST'])
@login_required
def bulk_generate_forecasts():
    """Generate forecasts for multiple product-channel combinations."""
    try:
        data = request.get_json()
        
        combinations = data.get('combinations', [])
        if not combinations:
            return jsonify({
                'error': 'combinations array is required',
                'status': 'error'
            }), 400
        
        forecast_horizon = data.get('forecast_horizon', 30)
        algorithm = data.get('algorithm', 'auto')
        apply_seasonal = data.get('apply_seasonal', True)
        
        results = []
        errors = []
        
        for combo in combinations:
            try:
                product_id = combo.get('product_id')
                sales_channel_id = combo.get('sales_channel_id')
                external_factors = combo.get('external_factors', {})
                
                if not product_id or not sales_channel_id:
                    errors.append({
                        'combination': combo,
                        'error': 'Missing product_id or sales_channel_id'
                    })
                    continue
                
                result = forecasting_service.generate_comprehensive_forecast(
                    product_id=product_id,
                    sales_channel_id=sales_channel_id,
                    forecast_horizon=forecast_horizon,
                    algorithm=algorithm,
                    apply_seasonal=apply_seasonal,
                    external_factors=external_factors,
                    save_to_db=True,
                    created_by=str(current_user.id)
                )
                
                results.append({
                    'product_id': product_id,
                    'sales_channel_id': sales_channel_id,
                    'forecast_id': result.get('forecast_id'),
                    'status': 'success' if 'error' not in result else 'error',
                    'summary': result.get('summary', {})
                })
                
            except Exception as e:
                errors.append({
                    'combination': combo,
                    'error': str(e)
                })
        
        return jsonify({
            'status': 'completed',
            'successful': len(results),
            'errors': len(errors),
            'results': results,
            'error_details': errors
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in bulk forecast generation: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500


# === STOCK OPTIMIZATION ENDPOINTS ===

@bp.route('/stock-optimization/optimize', methods=['POST'])
@login_required
def optimize_stock_levels():
    """Optimize stock levels for products with constraints."""
    try:
        data = request.get_json()
        
        # Validate required fields
        product_id = data.get('product_id')
        if not product_id:
            return jsonify({
                'error': 'product_id is required',
                'status': 'error'
            }), 400
        
        # Parse parameters
        location_id = data.get('location_id')
        service_level = ServiceLevel(data.get('service_level', ServiceLevel.STANDARD.value))
        objective = OptimizationObjective(data.get('objective', OptimizationObjective.BALANCED.value))
        forecast_horizon = data.get('forecast_horizon', 90)
        
        # Parse constraints
        constraints_data = data.get('constraints', {})
        constraints = SupplyChainConstraints(
            lead_time_days=constraints_data.get('lead_time_days', 14.0),
            lead_time_variability=constraints_data.get('lead_time_variability', 3.0),
            supplier_capacity_monthly=constraints_data.get('supplier_capacity_monthly'),
            production_capacity_monthly=constraints_data.get('production_capacity_monthly'),
            working_capital_limit=constraints_data.get('working_capital_limit'),
            storage_capacity_units=constraints_data.get('storage_capacity_units'),
            seasonal_capacity_factor=constraints_data.get('seasonal_capacity_factor', {})
        )
        
        # Parse cost parameters
        cost_data = data.get('cost_parameters', {})
        cost_params = CostParameters(
            holding_cost_percentage_annual=cost_data.get('holding_cost_percentage_annual', 0.25),
            ordering_cost_per_order=cost_data.get('ordering_cost_per_order', 100.0),
            stockout_cost_per_unit=cost_data.get('stockout_cost_per_unit', 50.0),
            storage_cost_per_unit_monthly=cost_data.get('storage_cost_per_unit_monthly', 0.10),
            working_capital_rate_annual=cost_data.get('working_capital_rate_annual', 0.08)
        )
        
        # Run optimization
        results = stock_optimization_service.optimize_stock_levels(
            product_id=product_id,
            location_id=location_id,
            service_level=service_level,
            constraints=constraints,
            cost_params=cost_params,
            objective=objective,
            forecast_horizon=forecast_horizon
        )
        
        return jsonify({
            'status': 'success',
            'optimization_results': [result.__dict__ for result in results],
            'parameters_used': {
                'service_level': service_level.value,
                'objective': objective.value,
                'forecast_horizon': forecast_horizon
            }
        })
        
    except ValueError as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 400
    except Exception as e:
        current_app.logger.error(f"Error optimizing stock levels: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/stock-optimization/abc-analysis', methods=['GET'])
@login_required
def get_abc_analysis():
    """Perform ABC analysis for inventory prioritization."""
    try:
        product_ids = request.args.getlist('product_ids')
        if not product_ids:
            product_ids = None  # Will analyze all products
        
        analysis = stock_optimization_service.perform_abc_analysis(product_ids)
        
        return jsonify({
            'status': 'success',
            'abc_analysis': analysis
        })
        
    except Exception as e:
        current_app.logger.error(f"Error performing ABC analysis: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/stock-optimization/slow-moving', methods=['GET'])
@login_required
def get_slow_moving_inventory():
    """Identify slow-moving inventory items."""
    try:
        days_threshold = int(request.args.get('days_threshold', 90))
        turnover_threshold = float(request.args.get('turnover_threshold', 2.0))
        
        slow_items = stock_optimization_service.identify_slow_moving_inventory(
            days_threshold=days_threshold,
            turnover_threshold=turnover_threshold
        )
        
        return jsonify({
            'status': 'success',
            'slow_moving_items': slow_items,
            'count': len(slow_items),
            'thresholds': {
                'days_threshold': days_threshold,
                'turnover_threshold': turnover_threshold
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error identifying slow-moving inventory: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/stock-optimization/multi-location', methods=['POST'])
@login_required
def optimize_multi_location():
    """Optimize inventory across multiple locations with constraints."""
    try:
        data = request.get_json()
        
        products = data.get('products', [])
        locations = data.get('locations', [])
        demand_forecasts = data.get('demand_forecasts', {})
        current_inventory = data.get('current_inventory', {})
        
        if not products or not locations:
            return jsonify({
                'error': 'products and locations are required',
                'status': 'error'
            }), 400
        
        # Parse constraints
        constraints_data = data.get('constraints', {})
        constraints = MultiLocationConstraints(
            total_working_capital_limit=constraints_data.get('total_working_capital_limit', 100000),
            total_storage_capacity=constraints_data.get('total_storage_capacity', 10000),
            production_capacity_by_product=constraints_data.get('production_capacity_by_product', {}),
            supplier_constraints=constraints_data.get('supplier_constraints', {}),
            transportation_constraints=constraints_data.get('transportation_constraints', {}),
            seasonal_factors=constraints_data.get('seasonal_factors', {}),
            cross_docking_opportunities=constraints_data.get('cross_docking_opportunities', []),
            consolidation_rules=constraints_data.get('consolidation_rules', {})
        )
        
        # Parse cost parameters
        cost_data = data.get('cost_parameters', {})
        cost_params = CostParameters(
            holding_cost_percentage_annual=cost_data.get('holding_cost_percentage_annual', 0.25),
            ordering_cost_per_order=cost_data.get('ordering_cost_per_order', 100.0),
            stockout_cost_per_unit=cost_data.get('stockout_cost_per_unit', 50.0),
            storage_cost_per_unit_monthly=cost_data.get('storage_cost_per_unit_monthly', 0.10),
            working_capital_rate_annual=cost_data.get('working_capital_rate_annual', 0.08)
        )
        
        # Parse service levels
        service_levels_data = data.get('service_levels', {})
        service_levels = {}
        for product_id, level in service_levels_data.items():
            service_levels[product_id] = ServiceLevel(level)
        
        # Parse objective
        objective = OptimizationObjective(data.get('objective', OptimizationObjective.BALANCED.value))
        
        # Run optimization
        result = constraint_solver.solve_multi_location_optimization(
            products=products,
            locations=locations,
            demand_forecasts=demand_forecasts,
            current_inventory=current_inventory,
            constraints=constraints,
            cost_params=cost_params,
            service_levels=service_levels,
            objective=objective
        )
        
        return jsonify({
            'status': 'success',
            'optimization_result': result
        })
        
    except ValueError as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 400
    except Exception as e:
        current_app.logger.error(f"Error optimizing multi-location inventory: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/supplier-performance/evaluate/<supplier_id>', methods=['GET'])
@login_required
def evaluate_supplier_performance(supplier_id):
    """Evaluate comprehensive supplier performance metrics."""
    try:
        evaluation_period = int(request.args.get('evaluation_period_months', 12))
        
        metrics = supplier_service.evaluate_supplier_performance(
            supplier_id=supplier_id,
            evaluation_period_months=evaluation_period
        )
        
        return jsonify({
            'status': 'success',
            'supplier_metrics': metrics.__dict__
        })
        
    except Exception as e:
        current_app.logger.error(f"Error evaluating supplier performance: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/supplier-performance/impact-analysis', methods=['POST'])
@login_required
def analyze_supplier_impact():
    """Analyze supplier performance impact on inventory optimization."""
    try:
        data = request.get_json()
        
        supplier_id = data.get('supplier_id')
        product_ids = data.get('product_ids', [])
        current_inventory_params = data.get('current_inventory_params', {})
        
        if not supplier_id:
            return jsonify({
                'error': 'supplier_id is required',
                'status': 'error'
            }), 400
        
        impact_analysis = supplier_service.analyze_supplier_impact_on_inventory(
            supplier_id=supplier_id,
            product_ids=product_ids,
            current_inventory_params=current_inventory_params
        )
        
        return jsonify({
            'status': 'success',
            'impact_analysis': impact_analysis.__dict__
        })
        
    except Exception as e:
        current_app.logger.error(f"Error analyzing supplier impact: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/supplier-performance/compare', methods=['POST'])
@login_required
def compare_suppliers():
    """Compare multiple suppliers across performance dimensions."""
    try:
        data = request.get_json()
        
        supplier_ids = data.get('supplier_ids', [])
        evaluation_criteria = data.get('evaluation_criteria')
        
        if not supplier_ids:
            return jsonify({
                'error': 'supplier_ids array is required',
                'status': 'error'
            }), 400
        
        comparison = supplier_service.compare_suppliers(
            supplier_ids=supplier_ids,
            evaluation_criteria=evaluation_criteria
        )
        
        return jsonify({
            'status': 'success',
            'supplier_comparison': comparison
        })
        
    except Exception as e:
        current_app.logger.error(f"Error comparing suppliers: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/supplier-performance/scorecard/<supplier_id>', methods=['GET'])
@login_required
def get_supplier_scorecard(supplier_id):
    """Generate comprehensive supplier scorecard."""
    try:
        scorecard = supplier_service.generate_supplier_scorecard(supplier_id)
        
        return jsonify({
            'status': 'success',
            'scorecard': scorecard
        })
        
    except Exception as e:
        current_app.logger.error(f"Error generating supplier scorecard: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/supplier-performance/optimize-mix', methods=['POST'])
@login_required
def optimize_supplier_mix():
    """Optimize supplier mix for a product category."""
    try:
        data = request.get_json()
        
        product_category = data.get('product_category')
        demand_forecast = data.get('demand_forecast', {})
        available_suppliers = data.get('available_suppliers', [])
        constraints = data.get('constraints')
        
        if not product_category or not available_suppliers:
            return jsonify({
                'error': 'product_category and available_suppliers are required',
                'status': 'error'
            }), 400
        
        optimization = supplier_service.optimize_supplier_mix(
            product_category=product_category,
            demand_forecast=demand_forecast,
            available_suppliers=available_suppliers,
            constraints=constraints
        )
        
        return jsonify({
            'status': 'success',
            'supplier_mix_optimization': optimization
        })
        
    except Exception as e:
        current_app.logger.error(f"Error optimizing supplier mix: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/stock-optimization/eoq-calculator', methods=['POST'])
@login_required
def calculate_eoq():
    """Calculate Economic Order Quantity with variations."""
    try:
        data = request.get_json()
        
        annual_demand = data.get('annual_demand')
        ordering_cost = data.get('ordering_cost')
        holding_cost_rate = data.get('holding_cost_rate')
        unit_cost = data.get('unit_cost')
        
        if any(x is None for x in [annual_demand, ordering_cost, holding_cost_rate, unit_cost]):
            return jsonify({
                'error': 'annual_demand, ordering_cost, holding_cost_rate, and unit_cost are required',
                'status': 'error'
            }), 400
        
        # Parse optional constraints
        constraints_data = data.get('constraints', {})
        constraints = SupplyChainConstraints(
            lead_time_days=constraints_data.get('lead_time_days', 14.0),
            lead_time_variability=constraints_data.get('lead_time_variability', 3.0),
            supplier_capacity_monthly=constraints_data.get('supplier_capacity_monthly'),
            production_capacity_monthly=constraints_data.get('production_capacity_monthly'),
            working_capital_limit=constraints_data.get('working_capital_limit'),
            storage_capacity_units=constraints_data.get('storage_capacity_units')
        ) if constraints_data else None
        
        eoq_result = stock_optimization_service.calculate_eoq(
            annual_demand=annual_demand,
            ordering_cost=ordering_cost,
            holding_cost_rate=holding_cost_rate,
            unit_cost=unit_cost,
            constraints=constraints
        )
        
        return jsonify({
            'status': 'success',
            'eoq_calculation': eoq_result
        })
        
    except Exception as e:
        current_app.logger.error(f"Error calculating EOQ: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@bp.route('/stock-optimization/safety-stock-calculator', methods=['POST'])
@login_required
def calculate_safety_stock():
    """Calculate optimal safety stock based on demand and lead time variability."""
    try:
        data = request.get_json()
        
        demand_mean = data.get('demand_mean')
        demand_std = data.get('demand_std')
        lead_time_days = data.get('lead_time_days')
        lead_time_variability = data.get('lead_time_variability')
        service_level = data.get('service_level', ServiceLevel.STANDARD.value)
        
        if any(x is None for x in [demand_mean, demand_std, lead_time_days, lead_time_variability]):
            return jsonify({
                'error': 'demand_mean, demand_std, lead_time_days, and lead_time_variability are required',
                'status': 'error'
            }), 400
        
        service_level_enum = ServiceLevel(service_level)
        
        safety_stock_result = stock_optimization_service.calculate_safety_stock(
            demand_mean=demand_mean,
            demand_std=demand_std,
            lead_time_days=lead_time_days,
            lead_time_variability=lead_time_variability,
            service_level=service_level_enum
        )
        
        return jsonify({
            'status': 'success',
            'safety_stock_calculation': safety_stock_result
        })
        
    except Exception as e:
        current_app.logger.error(f"Error calculating safety stock: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500