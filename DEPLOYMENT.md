# Production deployment

Deployment target:

- Frontend: Vercel
- API: Render Docker web service
- Database: managed PostgreSQL

## Run locally

In PowerShell, from `backend/BulkMessaging.API`, set the required authentication
settings for the current terminal session, then run the API. This generates a
fresh random signing key and prompts for the administrator credentials without
putting the password in the command history:

```powershell
$keyBytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($keyBytes)
$env:Jwt__SigningKey = [Convert]::ToBase64String($keyBytes)
$env:BootstrapAdmin__Email = Read-Host "Initial administrator email"
$securePassword = Read-Host "Initial administrator password" -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $env:BootstrapAdmin__Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}
dotnet run
```

Use an administrator password with at least 12 characters, including uppercase,
lowercase, a digit, and a symbol. These environment variables apply only to
this terminal session. If the API stops, repeat the setup before running it
again. The initial admin credentials are the email and password entered above.
The generated signing key also changes each time; this is fine for local
development but will invalidate existing tokens when the API restarts.

## 1. Create PostgreSQL

Provision a managed PostgreSQL instance. Keep the connection string private and
set it as a Render environment variable:

```text
ConnectionStrings__DefaultConnection=<managed PostgreSQL connection string>
```

The API applies the checked-in EF Core migrations at startup.

## 2. Deploy the API to Render

Create a Docker web service from this repository:

- Dockerfile: `backend/BulkMessaging.API/Dockerfile`
- Docker build context: `backend/BulkMessaging.API`
- Health check path: `/health`

Configure these Render environment variables. Mark passwords/keys and provider
credentials as secrets:

```text
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=<managed PostgreSQL connection string>
Cors__AllowedOrigins=https://<your-vercel-domain>
Jwt__SigningKey=<at least 32 random UTF-8 bytes; use a secret manager>
BootstrapAdmin__Email=<initial administrator email>
BootstrapAdmin__Password=<strong initial administrator password>
BootstrapAdmin__DisplayName=<optional display name>
Jwt__Issuer=BulkMessaging.API
Jwt__Audience=BulkMessaging.Client
Jwt__AccessTokenMinutes=30
```

`Jwt__SigningKey`, `BootstrapAdmin__Email`, and `BootstrapAdmin__Password` are
required. The bootstrap password must be at least 12 characters and include an
uppercase letter, lowercase letter, digit, and symbol. Generate a unique random
signing key; never reuse a sample value or commit one to source control.

At startup, the API creates the initial administrator only if that email does
not already exist. `BootstrapAdmin__Password` must remain configured for the
service to start; changing it later does not reset an existing account. Keep
the value stored as a protected Render secret. Changing the JWT signing key
invalidates all active access tokens.

JWT access tokens expire after 30 minutes by default. Configure
`Jwt__AccessTokenMinutes` from 5 to 1440. Login is rate-limited by Identity
lockout after five failed attempts for 15 minutes.

Email and SMS provider settings must be configured as Render secrets using the
provider's required .NET configuration names. SMTP settings use `Smtp__Host`,
`Smtp__Port`, `Smtp__Username`, `Smtp__Password`, and `Smtp__FromAddress`.
Configure the `AfroMessage__` variables required by your SMS provider. Never
put provider credentials in frontend environment variables.

The API now requires authentication for application data and messaging
endpoints. The initial administrator signs in using the bootstrap credentials.
Create additional accounts in **Administration → Users**. Do not give the
bootstrap administrator password to other users.

## 3. Deploy the frontend to Vercel

Import the repository into Vercel and configure:

- Root directory: `frontend/bulk-messaging-ui`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set the following Vercel environment variable for Production:

```text
VITE_API_BASE_URL=https://<your-render-api-domain>/api
```

Add your exact Vercel production origin (scheme and hostname only, no path) to
Render's `Cors__AllowedOrigins`. For Vercel Preview deployments, include only
the specific trusted preview origins you intend to use. Redeploy Vercel after
changing environment variables because Vite embeds them at build time.

## 4. Verify deployment

1. Confirm Render reports healthy at `/health` and startup migrations succeed.
2. Sign in as the bootstrap administrator.
3. Create a non-admin account with a temporary password and verify that it is
   required to change that password before accessing app data.
4. Verify a non-admin cannot access **Administration → Users** or its API.
5. Verify logout revokes the token and an expired/revoked token returns the user
   to sign-in.
6. Verify CORS from the deployed Vercel origin and check browser network logs.
7. Test sending only with provider-approved test recipients.

## Security notes

- CORS is not access control. Authentication and role-based authorization are
  enforced by the API.
- New user accounts are created as regular users and must change their
  temporary password at first sign-in. `isAdmin` is not accepted in the create
  user request.
- Protect access to Render, Vercel, and the database with individual accounts
  and multi-factor authentication.
- Back up PostgreSQL and test a restore before using this for live messaging.
- Confirm applicable consent, opt-out, and messaging regulations before
  sending campaigns.
