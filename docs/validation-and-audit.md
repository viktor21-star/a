# Validation And Audit

Имплементирано:

- backend validation за `Location` и `Item`
- standard `VALIDATION_ERROR` response за master data write endpoints
- audit service abstraction и demo implementation
- frontend приказ на validation порака
- frontend edit flow за локации и артикли

Следно:

1. audit persistence во `AuditLogs`
2. field-level validation UX
3. optimistic update или modal edit UX
