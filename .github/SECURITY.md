# Security Policy — ILH Audits

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | ✅ Active           |

## Reporting a Vulnerability

If you discover a security vulnerability in this application, **please do NOT open a public GitHub issue.** Instead, please report it responsibly:

1. **Email:** Send details to the project maintainer directly.
2. **Include:** A clear description of the vulnerability, steps to reproduce, and any potential impact.
3. **Response Time:** We aim to acknowledge reports within 48 hours and provide a fix within 7 days for critical issues.

## Security Measures in Place

- **Row Level Security (RLS):** All database tables enforce RLS policies via Supabase PostgreSQL, ensuring users can only access data they are authorized to see.
- **Cookie-based Session Auth:** Authentication tokens are managed via httpOnly cookies through the Supabase SSR library, preventing XSS token theft.
- **Environment Variable Isolation:** All API keys and secrets are stored in `.env.local` (gitignored) and never committed to the repository.
- **Branch Protection:** The `main` branch requires pull request reviews before merging.

## Sensitive Files

The following files and directories contain security-critical logic and should be reviewed carefully in any PR:

- `supabase/schema.sql` — Database schema and RLS policies
- `src/lib/supabase/` — Client and server authentication logic
- `src/middleware.ts` — Route-level auth enforcement
- `.env*` — Environment variables (gitignored, never committed)
