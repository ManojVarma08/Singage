# Signage Ctrl — Digital Signage Platform

Control 10 TVs from your phone. Upload images/videos and they display instantly.

## Architecture

```
Phone App (React Native)
    ↓ PUT /tv/{id}
API Gateway → Lambda
    ↓ Save              ↓ Publish
DynamoDB           AWS IoT Core
                        ↓ WebSocket
                   TV Browser (Next.js)
                        ↓ Displays media
                   Smart TV Chrome
```

## Project Structure

```
signage-ctrl/
├── apps/
│   ├── mobile/     ← Phone app (React Native + Expo)
│   └── tv/         ← TV display app (Next.js)
├── packages/
│   ├── shared/     ← Types, constants, utils
│   └── ui/         ← Shared UI components
├── backend/        ← AWS Lambda functions
└── infrastructure/ ← AWS Terraform configs
```

## Quick Start

### 1. Fill AWS Keys

Edit `packages/shared/src/constants.ts`:

```typescript
export const AWS_CONFIG = {
  region: 'us-east-2',
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
  s3Bucket: 'signage-ctrl-media',
  iotEndpoint: 'YOUR_IOT_ENDPOINT',
  apiBaseUrl: 'YOUR_API_GATEWAY_URL',  // after backend deploy
};
```

### 2. Run TV App

```bash
cd apps/tv
npm install
npm run dev
```

Open in Smart TV Chrome:
- `http://localhost:3001/tv/TV1` ← TV 1
- `http://localhost:3001/tv/TV2` ← TV 2

### 3. Run Phone App (Web version for testing)

```bash
cd apps/web  # coming soon
npm run dev
```

### 4. Deploy Backend to AWS

```bash
cd backend
npm install
npx serverless deploy
```

Copy the API Gateway URL and paste into `AWS_CONFIG.apiBaseUrl`

### 5. Build Phone App (Android APK)

```bash
cd apps/mobile
npm install
eas login
eas build --platform android --profile preview
```

## How It Works

1. **TV** opens Chrome → navigates to `your-url/tv/TV1`
2. **TV** shows QR code with TV ID
3. **Phone** opens app → taps "Scan TV QR"
4. **Phone** scans QR → connects to TV1
5. **Phone** selects layout → picks image/video
6. **Phone** uploads to S3 → Lambda saves to DynamoDB → IoT publishes
7. **TV** receives update instantly → displays media
8. **App closes** → S3 URL + DynamoDB still has data → TV keeps showing ✅

## TV URLs

| TV | URL |
|----|-----|
| TV 1 | `/tv/TV1` |
| TV 2 | `/tv/TV2` |
| TV 3 | `/tv/TV3` |
| ... | ... |
| TV 10 | `/tv/TV10` |

## Free Tier Limits

| Service | Free | Your Usage |
|---------|------|-----------|
| DynamoDB | 25GB, 200M requests | ~1MB, <1000 req/day |
| S3 | 5GB, 20K requests | ~100 photos/videos |
| Lambda | 1M requests/month | ~1000 req/day |
| IoT Core | 500K messages | ~100 messages/day |
