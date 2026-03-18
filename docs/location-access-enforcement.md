# Location Access Enforcement

Имплементирано:

- backend `CurrentUserProvider` преку request header `X-Demo-UserId`
- filtering на `plans`, `batches`, `waste`, `alerts` според allowed locations
- frontend API клиент праќа `X-Demo-UserId` од локалниот auth state
- demo login сега најавува оператор со ограничен пристап

Значење:

- корисникот веќе не гледа глобални податоци
- API враќа само записи за доделените локации
