# Page Pulse

A production-ready URL Audit Service that analyzes websites and returns audit reports covering performance, security, accessibility, SEO, and best practices. Built to handle high traffic with caching, rate limiting, validation, structured logging, and automated testing.


## Features

Input validation • Request timeouts • Concurrency limits • Configurable caching • Rate limiting • Structured errors & logging • Request ID tracking • Automated tests • CI • REST API • Responsive React + Vite frontend

## Tech Stack

**Frontend:** React, Vite, TypeScript, Tailwind CSS, Axios
**Backend:** Node.js, Express.js, TypeScript, JWT (optional), Express Validator, Node Cache / Redis, Pino / Winston, Jest, Supertest

## Production Features

- **Validation** — rejects malformed URLs, returns structured errors
- **Timeouts** — configurable request timeout limits
- **Concurrency Control** — caps simultaneous audits to prevent overload
- **Caching** — configurable duration, reduces repeated external calls
- **Rate Limiting** — per-client request limits
- **Structured Logging** — request IDs, request/response and error logs

**Error response example:**
```json
{
  "success": false,
  "requestId": "8e47d1bc",
  "error": { "code": "INVALID_URL", "message": "The supplied URL is invalid." }
}
```

---

## Installation

```bash
git clone https://github.com/mskmohan50-profile/Page-Pulse.git
cd Page-Pulse

# Frontend
npm install
npm run dev        

# Backend
cd server
npm install
npm run dev         
```

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audit` | Audit a website URL |

---

## Testing

```bash
npm test              
npm run test:coverage 
```

---

## CI

GitHub Actions installs dependencies, runs tests, verifies the build, and reports failures on every push/PR.

---

## Future Improvements

Redis distributed cache • Queue-based workers • Horizontal scaling • Docker & Kubernetes • Metrics dashboard • Prometheus & Grafana

---

## Author

**Mohanraj G** — [GitHub](https://github.com/mskmohan50-profile)

## License

MIT