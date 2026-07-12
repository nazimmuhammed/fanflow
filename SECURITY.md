# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in FanFlow AI, please report it by opening a GitHub issue or contacting the maintainers directly. We take security seriously and will respond as quickly as possible.

## Security Measures in Place

- **CORS restrictions:** API access is limited to known frontend origins only.
- **Input validation:** All API request bodies are validated with length and type constraints via Pydantic.
- **Rate limiting:** AI-powered endpoints are rate-limited per client to prevent abuse and cost overruns.
- **Secret management:** API keys are never committed to the repository; they are loaded from environment variables (.env locally, encrypted environment variables in production).
- **Error handling:** Internal error details and stack traces are not exposed to API consumers.
- **Security headers:** Standard HTTP security headers (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security) are applied to all responses.
- **Dependency scanning:** Automated weekly dependency vulnerability scanning via GitHub Dependabot.
- **Automated testing:** All changes are validated by a CI test suite before merge.

## Supported Versions

This is a hackathon/concept project (single main branch). Security fixes are applied directly to main.
