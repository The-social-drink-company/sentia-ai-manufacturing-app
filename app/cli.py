import click
from flask.cli import with_appcontext
from datetime import timedelta
from app import db
from app.utils.database import DatabaseManager, DataSeeder, DatabaseBackup

@click.command()
@with_appcontext
def init_db():
    """Initialize the database with tables and seed data."""
    click.echo('Initializing database...')
    
    # Test connection first
    connection_result = DatabaseManager.test_connection()
    if not connection_result['connected']:
        click.echo(f"Error: Database connection failed: {connection_result['error']}")
        return
    
    click.echo(f"[OK] Database connection successful: {connection_result['database_version']}")
    
    # Create all tables
    create_result = DatabaseManager.create_all_tables()
    if create_result['status'] == 'error':
        click.echo(f"Error creating tables: {create_result['error']}")
        return
    
    click.echo("[OK] Database tables created successfully")
    
    # Seed basic data
    seed_result = DataSeeder.seed_basic_data()
    if seed_result['status'] == 'error':
        click.echo(f"Error seeding data: {seed_result['error']}")
        return
    
    click.echo("[OK] Basic data seeded successfully")
    click.echo("\nSeeding results:")
    for table, count in seed_result['results'].items():
        if isinstance(count, int) and count > 0:
            click.echo(f"  - {table}: {count} records created")
        elif count:
            click.echo(f"  - {table}: [OK]")
    
    click.echo("\nDatabase initialization complete!")
    click.echo("\nDefault admin credentials:")
    click.echo("  Username: admin")
    click.echo("  Password: ChangeMe123!")
    click.echo("  WARNING: Please change the default password immediately!")

@click.command()
@with_appcontext
def test_db():
    """Test database connection and show table information."""
    click.echo('Testing database connection...')
    
    # Test connection
    connection_result = DatabaseManager.test_connection()
    if connection_result['connected']:
        click.echo(f"[OK] Connection successful: {connection_result['database_version']}")
        if 'database_url' in connection_result:
            click.echo(f"     Database URL: {connection_result['database_url']}")
    else:
        click.echo(f"[ERROR] Connection failed: {connection_result['error']}")
        return
    
    # Get table info
    table_info = DatabaseManager.get_table_info()
    if table_info['status'] == 'success':
        click.echo(f"\n[OK] Found {table_info['table_count']} tables:")
        for table_name, info in table_info['tables'].items():
            click.echo(f"  - {table_name}: {info['columns']} columns, {info['indexes']} indexes")
    else:
        click.echo(f"[ERROR] Failed to get table info: {table_info['error']}")
    
    # Get database stats
    stats_result = DatabaseBackup.get_database_stats()
    if stats_result['status'] == 'success':
        click.echo(f"\nDatabase Statistics:")
        click.echo(f"  Total records: {stats_result['total_records']}")
        for table, count in stats_result['table_counts'].items():
            if isinstance(count, int):
                click.echo(f"  - {table}: {count} records")

@click.command()
@with_appcontext
def seed_demo_data():
    """Seed the database with demo data for testing."""
    click.echo('Seeding demo data...')
    
    # This is a placeholder for demo data seeding
    # You can expand this to create sample historical sales, forecasts, etc.
    
    from datetime import date, datetime, timezone
    from app.models import Product, SalesChannel, HistoricalSales
    import random
    
    try:
        # Get first product and sales channel for demo data
        product = Product.query.first()
        sales_channel = SalesChannel.query.first()
        
        if not product or not sales_channel:
            click.echo("Error: No products or sales channels found. Run 'flask init-db' first.")
            return
        
        # Create some sample historical sales data
        demo_sales = []
        for i in range(30):  # 30 days of sample data
            sale_date = date.today() - timedelta(days=i)
            quantity = random.randint(1, 10)
            unit_price = float(product.selling_price or 29.99)
            
            sale = HistoricalSales(
                product_id=product.id,
                sales_channel_id=sales_channel.id,
                sale_date=sale_date,
                sale_datetime=datetime.combine(sale_date, datetime.now().time()),
                quantity_sold=quantity,
                unit_price=unit_price,
                gross_revenue=quantity * unit_price,
                net_revenue=quantity * unit_price * 0.85,  # Assume 15% fees
                data_source='demo',
                is_validated=True
            )
            demo_sales.append(sale)
        
        db.session.bulk_save_objects(demo_sales)
        db.session.commit()
        
        click.echo(f"[OK] Created {len(demo_sales)} demo sales records")
        
    except Exception as e:
        click.echo(f"Error creating demo data: {str(e)}")
        db.session.rollback()

@click.command()
@click.argument('table_name')
@click.option('--limit', default=None, type=int, help='Limit number of records to export')
@with_appcontext
def export_table(table_name, limit):
    """Export data from a specific table."""
    click.echo(f'Exporting data from table: {table_name}')
    
    result = DatabaseBackup.export_table_data(table_name, limit)
    
    if result['status'] == 'success':
        click.echo(f"[OK] Exported {result['record_count']} records from {result['table']}")
        
        # Save to file
        import json
        from datetime import datetime
        filename = f"{table_name}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(result, f, indent=2, default=str)
        
        click.echo(f"[OK] Data saved to {filename}")
    else:
        click.echo(f"[ERROR] Export failed: {result['error']}")

@click.command()
@click.option('--username', prompt='Admin username', help='Username for the admin user')
@click.option('--email', prompt='Admin email', help='Email for the admin user')
@click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True, help='Password for the admin user')
@click.option('--first-name', prompt='First name', help='First name of the admin user')
@click.option('--last-name', prompt='Last name', help='Last name of the admin user')
@with_appcontext
def create_admin(username, email, password, first_name, last_name):
    """Create an admin user."""
    from app.models.user import User
    
    try:
        # Check if admin user already exists
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            click.echo(f"Error: User with username '{username}' or email '{email}' already exists")
            return
        
        # Validate password strength
        if not User.validate_password_strength(password):
            click.echo("Error: Password must be at least 8 characters and contain uppercase, lowercase, number, and special character")
            return
        
        # Create admin user
        admin_user = User(
            username=username,
            email=email.lower(),
            first_name=first_name,
            last_name=last_name,
            role='admin',
            is_admin=True,
            is_active=True
        )
        admin_user.set_password(password)
        
        db.session.add(admin_user)
        db.session.commit()
        
        click.echo(f"[OK] Admin user '{username}' created successfully!")
        click.echo(f"     Email: {email}")
        click.echo(f"     Role: Administrator")
        click.echo(f"     User can now login and manage the system")
        
    except Exception as e:
        click.echo(f"Error creating admin user: {str(e)}")
        db.session.rollback()

@click.command()
@with_appcontext
def list_users():
    """List all users in the system."""
    from app.models.user import User
    
    try:
        users = User.query.order_by(User.created_at.desc()).all()
        
        if not users:
            click.echo("No users found in the system")
            return
        
        click.echo(f"Found {len(users)} users:")
        click.echo("-" * 80)
        
        for user in users:
            status = "Active" if user.is_active else "Inactive"
            admin_flag = " [ADMIN]" if user.is_admin else ""
            locked_flag = " [LOCKED]" if user.is_account_locked() else ""
            
            click.echo(f"Username: {user.username:<20} Email: {user.email:<30}")
            click.echo(f"Name: {user.display_name or 'Not set':<25} Role: {user.role:<15} Status: {status}{admin_flag}{locked_flag}")
            click.echo(f"Created: {user.created_at.strftime('%Y-%m-%d %H:%M') if user.created_at else 'Unknown'}")
            click.echo(f"Last Login: {user.last_login.strftime('%Y-%m-%d %H:%M') if user.last_login else 'Never'}")
            click.echo("-" * 80)
            
    except Exception as e:
        click.echo(f"Error listing users: {str(e)}")

@click.command()
@click.argument('username')
@with_appcontext 
def reset_user_password(username):
    """Reset a user's password (generates a new temporary password)."""
    from app.models.user import User
    import secrets
    import string
    
    try:
        user = User.query.filter_by(username=username).first()
        
        if not user:
            click.echo(f"Error: User '{username}' not found")
            return
        
        # Generate temporary password
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))
        
        user.set_password(temp_password)
        user.force_password_change = True
        user.failed_login_attempts = 0
        user.account_locked_until = None
        
        db.session.commit()
        
        click.echo(f"[OK] Password reset for user '{username}'")
        click.echo(f"     Temporary password: {temp_password}")
        click.echo(f"     User must change password on next login")
        click.echo(f"     WARNING: Save this password securely and share it safely")
        
    except Exception as e:
        click.echo(f"Error resetting password: {str(e)}")
        db.session.rollback()

def init_app(app):
    """Register CLI commands with the Flask app."""
    app.cli.add_command(init_db)
    app.cli.add_command(test_db)
    app.cli.add_command(seed_demo_data)
    app.cli.add_command(export_table)
    app.cli.add_command(create_admin)
    app.cli.add_command(list_users)
    app.cli.add_command(reset_user_password)