# Daily Sync Worker

Имплементирано:

- background worker за дневен sync
- config преку `MasterDataSync`
- manual trigger endpoint само за admin

Config:

```json
"MasterDataSync": {
  "Enabled": true,
  "DailyTime": "02:00"
}
```

Правило:

- автоматски sync се извршува еднаш дневно
- manual trigger е дозволен само за admin
