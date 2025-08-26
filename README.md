# Sentia Manufacturing Planning Dashboard

A modern, AI-powered manufacturing planning and scheduling system built with Flask and PostgreSQL.

## Tech Stack

- **Backend**: Flask (Python 3.11+)
- **Database**: Neon PostgreSQL with vector support
- **Frontend**: HTML/CSS/JavaScript (responsive design)
- **Hosting**: Railway
- **Development**: Cursor IDE + Claude Code CLI
- **Version Control**: GitHub with CI/CD

## Project Structure

```
sentia-manufacturing-dashboard/
├── app/                    # Flask application
│   ├── models/            # Database models
│   ├── routes/            # API and view routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── templates/         # HTML templates
├── context/               # Documentation and specifications
├── static/                # Static assets
├── migrations/            # Database migrations
├── tests/                 # Test suite
├── config.py              # Configuration settings
├── run.py                 # Application entry point
└── requirements.txt       # Python dependencies
```

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/sentia-manufacturing-dashboard.git
cd sentia-manufacturing-dashboard
```

### 2. Create virtual environment
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
```bash
cp .env.template .env
# Edit .env with your configuration
```

### 5. Initialize database
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### 6. Run the application
```bash
python run.py
```

The application will be available at `http://localhost:5000`

## Branch Structure

- `development` - Active development branch
- `test` - User acceptance testing
- `production` - Live production environment

All branches auto-deploy to respective Railway environments with corresponding Neon databases.

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/jobs` - List all jobs
- `GET /api/schedule` - Get current schedule
- `POST /api/optimize` - Trigger schedule optimization

## Features

- Real-time production scheduling
- AI-powered optimization algorithms
- Resource allocation and management
- Job tracking and monitoring
- Performance analytics dashboard
- Multi-user support with role-based access

## Development Workflow

1. Always work on the `development` branch
2. Test features locally before committing
3. Push to trigger automatic deployment to Railway dev environment
4. After testing, merge to `test` branch for UAT
5. Finally, merge to `production` for release

## Testing

Run tests with:
```bash
pytest
# Or with coverage:
pytest --cov=app tests/
```

## Deployment

The application automatically deploys to Railway on push to respective branches:
- `development` → dev.sentia-manufacturing.railway.app
- `test` → test.sentia-manufacturing.railway.app
- `production` → sentia-manufacturing.railway.app

## Contributing

1. Create feature branch from `development`
2. Make changes and test locally
3. Submit pull request to `development`
4. After review, changes will be merged

## License

Proprietary - Sentia Manufacturing Solutions

## Support

For issues or questions, contact the development team.