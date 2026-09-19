# Naji Developer Portfolio

A modern responsive portfolio for Ahamed Najil Kilayil with a Hackatime coding-statistics integration.

## Files

- `index.html` — portfolio structure
- `style.css` — responsive glassmorphism UI
- `script.js` — interactions + Hackatime OAuth PKCE

## Hackatime setup

Hackatime supports OAuth 2.0 and PKCE for public SPA clients.

1. Create an OAuth application in Hackatime.
2. Set its Redirect URI to the exact URL where this portfolio is hosted.
3. Request the `profile read` scopes.
4. Copy the OAuth Client ID.
5. Open `script.js`.
6. Replace:

   `YOUR_HACKATIME_CLIENT_ID`

   with your real Client ID.

7. Deploy the site.
8. Click **Connect Hackatime** on the portfolio and authorize it.

The portfolio calls:
- `/api/v1/authenticated/hours`
- `/api/v1/authenticated/streak`
- `/api/v1/authenticated/projects`

The hours card uses a wide date range (`2000-01-01` → today) because Hackatime's hours endpoint is date-range based.

### Important

Do NOT put a Hackatime client secret or your editor API key in this frontend. The site uses OAuth + PKCE, which is intended for public clients such as SPAs.

## Personal details to edit

Search `index.html` for:
- email address
- GitHub profile URL
- project descriptions
- any other public profile details you want to change.
