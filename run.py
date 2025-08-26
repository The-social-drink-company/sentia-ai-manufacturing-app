import os
from app import create_app, db
from config import config

app = create_app(config[os.getenv('FLASK_CONFIG') or 'default'])

@app.shell_context_processor
def make_shell_context():
    from app.models import User, Job, Schedule, Resource
    return dict(db=db, User=User, Job=Job, Schedule=Schedule, Resource=Resource)

@app.cli.command()
def init_db():
    """Initialize the database."""
    db.create_all()
    print("Database initialized!")

@app.cli.command()
def test():
    """Run the unit tests."""
    import unittest
    tests = unittest.TestLoader().discover('tests')
    unittest.TextTestRunner(verbosity=2).run(tests)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)