# Backend Next Steps

Следни конкретни задачи за реална имплементација:

1. замена на `Demo*Repository` со `SqlServer*Repository`
2. додавање `DbContext` или `Dapper` слој
3. JWT authentication и refresh tokens
4. validation layer за request DTO
5. background jobs за POS import и alerts engine
6. audit interceptor за сите write операции
7. Excel/PDF export service

Тековната структура веќе има:

- application services
- repository interfaces
- demo infrastructure adapters
- endpoint separation
