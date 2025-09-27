# Domain Layer

The domain layer contains the business logic and entities of the application. This layer is independent of any framework or infrastructure concerns.

## Structure

```
domain/
├── entities/          # Business entities
├── value-objects/     # Immutable value objects
├── repositories/      # Repository interfaces
├── services/          # Domain services
└── events/           # Domain events
```

## Principles
- No dependencies on external frameworks
- Pure business logic
- Immutable entities where possible
- Domain-driven design patterns