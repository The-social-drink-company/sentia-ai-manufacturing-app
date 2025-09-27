# Application Layer

The application layer contains use cases and application services that orchestrate the domain logic.

## Structure

```
application/
├── use-cases/         # Business use cases
├── services/          # Application services
├── dto/              # Data Transfer Objects
└── interfaces/       # Port interfaces
```

## Principles
- Orchestrates domain logic
- Implements use cases
- Handles cross-cutting concerns
- Defines application boundaries