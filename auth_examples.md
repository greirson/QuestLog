# OpenID Connect (OIDC) Provider Examples

This document provides example configurations for various OIDC providers that can be used with QuestLog.

## Environment Variables Template
All OIDC configurations use these environment variables:


# Google

### Google OAuth 2.0 / OpenID Connect
1. Go to Google Cloud Console
2. Create a new project or select existing one
3. Enable the OAuth 2.0 API
4. Create OAuth 2.0 Client ID credentials
5. Add authorized redirect URI: `http://localhost:3001/api/auth/oidc/callback`

### Environment Variables
OIDC_ISSUER=https://accounts.google.com
OIDC_AUTH_URL=https://accounts.google.com/o/oauth2/v2/auth
OIDC_TOKEN_URL=https://oauth2.googleapis.com/token
OIDC_USERINFO_URL=https://openidconnect.googleapis.com/v1/userinfo
OIDC_CLIENT_ID=your-client-id.apps.googleusercontent.com
OIDC_CLIENT_SECRET=your-client-secret