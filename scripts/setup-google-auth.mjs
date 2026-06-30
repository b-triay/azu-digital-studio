#!/usr/bin/env node
/**
 * One-time script to obtain a Google OAuth2 refresh token for Drive uploads.
 *
 * Usage:
 *   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/setup-google-auth.mjs
 *
 * Prerequisites:
 *   - Create a "Desktop app" OAuth2 client in GCP Console
 *     (APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID → Desktop app)
 *   - Copy the Client ID and Client Secret from the downloaded JSON
 */

import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';

const PORT = 8080;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('\nError: missing env vars.');
  console.error('Run as: GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/setup-google-auth.mjs\n');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPE,
  prompt: 'consent',
});

console.log('\nOpen this URL in your browser:\n');
console.log(authUrl);
console.log('\nWaiting for authorization on http://localhost:8080 ...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');

  if (!code) {
    res.writeHead(400);
    res.end('No authorization code received.');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h2 style="font-family:sans-serif">Authorization successful — you can close this tab.</h2>');
  server.close();

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.error('\nNo refresh token returned. Make sure you passed prompt=consent.');
      process.exit(1);
    }

    console.log('\n✓ Refresh token obtained!\n');
    console.log('Add these 3 variables to Vercel (Settings → Environment Variables):\n');
    console.log(`GOOGLE_CLIENT_ID=${clientId}`);
    console.log(`GOOGLE_CLIENT_SECRET=${clientSecret}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\nYou can delete GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY from Vercel.\n');
  } catch (err) {
    console.error('Failed to exchange code for tokens:', err.message);
    process.exit(1);
  }
});

server.listen(PORT);
