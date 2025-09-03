"""
Unleashed API routes for Flask backend
"""

from flask import Blueprint, jsonify, request
from app.integrations.unleashed_client import UnleashedClient

unleashed_bp = Blueprint('unleashed', __name__, url_prefix='/api/unleashed')

# Initialize client (will be created per request to ensure fresh credentials)
def get_client():
    """Create a new Unleashed client instance"""
    try:
        return UnleashedClient()
    except Exception as e:
        return None, str(e)


@unleashed_bp.route('/test', methods=['GET'])
def test_connection():
    """Test Unleashed API connection"""
    client = get_client()
    if isinstance(client, tuple):
        return jsonify({'success': False, 'error': client[1]}), 500
    
    success, message = client.test_connection()
    return jsonify({
        'success': success,
        'message': message
    })


@unleashed_bp.route('/products', methods=['GET'])
def get_products():
    """Get products from Unleashed"""
    client = get_client()
    if isinstance(client, tuple):
        return jsonify({'success': False, 'error': client[1]}), 500
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 50, type=int)
    
    try:
        data = client.get_products(page=page, page_size=page_size)
        return jsonify({
            'success': True,
            'data': data.get('Items', []),
            'total': data.get('Total', 0),
            'page': page,
            'page_size': page_size
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@unleashed_bp.route('/products/<product_guid>', methods=['GET'])
def get_product(product_guid):
    """Get a specific product by GUID"""
    client = get_client()
    if isinstance(client, tuple):
        return jsonify({'success': False, 'error': client[1]}), 500
    
    try:
        data = client.get_product(product_guid)
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@unleashed_bp.route('/stock', methods=['GET'])
def get_stock():
    """Get stock on hand"""
    client = get_client()
    if isinstance(client, tuple):
        return jsonify({'success': False, 'error': client[1]}), 500
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 50, type=int)
    
    try:
        data = client.get_stock_on_hand(page=page, page_size=page_size)
        return jsonify({
            'success': True,
            'data': data.get('Items', []),
            'total': data.get('Total', 0),
            'page': page,
            'page_size': page_size
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@unleashed_bp.route('/sales-orders', methods=['GET'])
def get_sales_orders():
    """Get sales orders"""
    client = get_client()
    if isinstance(client, tuple):
        return jsonify({'success': False, 'error': client[1]}), 500
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 50, type=int)
    order_status = request.args.get('status', None)
    
    try:
        data = client.get_sales_orders(page=page, page_size=page_size, order_status=order_status)
        return jsonify({
            'success': True,
            'data': data.get('Items', []),
            'total': data.get('Total', 0),
            'page': page,
            'page_size': page_size
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@unleashed_bp.route('/sales-orders/<order_guid>', methods=['GET'])
def get_sales_order(order_guid):
    """Get a specific sales order by GUID"""
    client = get_client()
    if isinstance(client, tuple):
        return jsonify({'success': False, 'error': client[1]}), 500
    
    try:
        data = client.get_sales_order(order_guid)
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@unleashed_bp.route('/purchase-orders', methods=['GET'])
def get_purchase_orders():
    """Get purchase orders"""
    client = get_client()
    if isinstance(client, tuple):
        return jsonify({'success': False, 'error': client[1]}), 500
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 50, type=int)
    
    try:
        data = client.get_purchase_orders(page=page, page_size=page_size)
        return jsonify({
            'success': True,
            'data': data.get('Items', []),
            'total': data.get('Total', 0),
            'page': page,
            'page_size': page_size
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@unleashed_bp.route('/customers', methods=['GET'])
def get_customers():
    """Get customers"""
    client = get_client()
    if isinstance(client, tuple):
        return jsonify({'success': False, 'error': client[1]}), 500
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 50, type=int)
    
    try:
        data = client.get_customers(page=page, page_size=page_size)
        return jsonify({
            'success': True,
            'data': data.get('Items', []),
            'total': data.get('Total', 0),
            'page': page,
            'page_size': page_size
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@unleashed_bp.route('/suppliers', methods=['GET'])
def get_suppliers():
    """Get suppliers"""
    client = get_client()
    if isinstance(client, tuple):
        return jsonify({'success': False, 'error': client[1]}), 500
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 50, type=int)
    
    try:
        data = client.get_suppliers(page=page, page_size=page_size)
        return jsonify({
            'success': True,
            'data': data.get('Items', []),
            'total': data.get('Total', 0),
            'page': page,
            'page_size': page_size
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@unleashed_bp.route('/warehouses', methods=['GET'])
def get_warehouses():
    """Get all warehouses"""
    client = get_client()
    if isinstance(client, tuple):
        return jsonify({'success': False, 'error': client[1]}), 500
    
    try:
        data = client.get_warehouses()
        return jsonify({
            'success': True,
            'data': data.get('Items', []),
            'total': len(data.get('Items', []))
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@unleashed_bp.route('/bill-of-materials', methods=['GET'])
def get_bill_of_materials():
    """Get bills of materials"""
    client = get_client()
    if isinstance(client, tuple):
        return jsonify({'success': False, 'error': client[1]}), 500
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 50, type=int)
    
    try:
        data = client.get_bill_of_materials(page=page, page_size=page_size)
        return jsonify({
            'success': True,
            'data': data.get('Items', []),
            'total': data.get('Total', 0),
            'page': page,
            'page_size': page_size
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@unleashed_bp.route('/stock-adjustments', methods=['GET'])
def get_stock_adjustments():
    """Get stock adjustments"""
    client = get_client()
    if isinstance(client, tuple):
        return jsonify({'success': False, 'error': client[1]}), 500
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 50, type=int)
    
    try:
        data = client.get_stock_adjustments(page=page, page_size=page_size)
        return jsonify({
            'success': True,
            'data': data.get('Items', []),
            'total': data.get('Total', 0),
            'page': page,
            'page_size': page_size
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500