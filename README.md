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
# Windows (uses a short, external path to avoid long-path issues):
py -3.13 -m venv C:\Users\DanielKenny\venvs\sentia
# or:
python -m venv C:\Users\DanielKenny\venvs\sentia

# Mac/Linux (project-local venv):
python -m venv venv
```

### 3. Activate and install dependencies
```bash
# Windows:
C:\Users\DanielKenny\venvs\sentia\Scripts\activate
python -m pip install -r requirements.txt

# Mac/Linux:
source venv/bin/activate
python -m pip install -r requirements.txt
```
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

## Database

- Uses PostgreSQL in production (Neon), SQLite by default in local development.
- Configure via `.env`:
  - `DATABASE_URL` (production), `DEV_DATABASE_URL` (local), `TEST_DATABASE_URL` (CI/tests)
- Manage schema with Flask-Migrate:
  - Initialize once: `flask db init`
  - Create migration: `flask db migrate -m "<message>"`
  - Apply: `flask db upgrade`
- Branch deployments auto-point to environment-specific databases.

## User Management

- Roles: admin, manager, operator, viewer (least-privilege by default).
- Sign-in: username or email + password; optional "Remember me" keeps you signed in longer.
- Security: account locks after multiple failed attempts; passwords must be strong; periodic password change enforced.
- Self-service: change password, request password reset if you forget it.
- Admins only: create users, set roles, activate/deactivate accounts, unlock locked accounts, and view users in the User Management page.

## Data Import

- Upload CSV/XLSX files for supported types (e.g., products, historical_sales).
- Go to Data Import, choose an import type, and select one or more files.
- Choose Validate to preview and check data without importing, or Import to run a background job.
- Built-in validation highlights errors, warnings, duplicates, and can auto-correct selected issues.
- Track progress in real time; open the import to see logs, errors, and summaries.
- Download ready-made templates from the Templates tab to format your data correctly.
- View all past imports, filter by status/type, and drill into details from History.
- Requires the data_import permission (managers and admins typically have access).

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