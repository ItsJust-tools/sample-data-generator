# Sample Data Generator

Generate realistic sample data (names, emails, addresses, IPs, UUIDs, JSON records) for testing and mockups.

**Live:** [sample-data-generator.itsjust.tools](https://sample-data-generator.itsjust.tools)

## Features

- Batch generation of fake names with a configurable count (1–1000)
- Email, phone, and address generation
- Random IPv4/IPv6 and MAC addresses; UUIDv4 identifiers
- Locale-aware output: English (US) and German (DE) name/address pools
- Deterministic seed option — the same seed always produces identical data
- JSON and CSV export with copy-to-clipboard and download buttons
- Serialize/shareable tool state via URL
- 100% client-side — no data ever leaves your browser

## Keyboard shortcuts

| Key | Action            |
| --- | ----------------- |
| `G` | Generate a batch  |
| `Y` | Copy current data |
| `L` | Toggle locale     |

## Development

```bash
npm install
npm run build -w @itsjust/core   # build shared core first
npm run dev
npm test
```

## Deployment

```bash
docker build -t itsjust-sample-data-generator .
docker run -p 3000:3000 itsjust-sample-data-generator
```

## License

MIT
