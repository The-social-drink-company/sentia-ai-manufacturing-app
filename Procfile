web: python run.py
worker: celery -A app.celery worker --loglevel=info
beat: celery -A app.celery beat --loglevel=info
release: flask db upgrade