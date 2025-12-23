# Environment Variables for Vercel

Copy these to your Vercel project settings:

## Required Environment Variables

```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/rotaractnyc?retryWrites=true&w=majority
NEXTAUTH_SECRET=generate-a-secure-random-string-here
NEXTAUTH_URL=https://your-project-name.vercel.app
ADMIN_EMAIL=admin@rotaractnyc.org
ADMIN_PASSWORD=your-secure-password-here
```

## How to Generate NEXTAUTH_SECRET

Run this command:
```bash
openssl rand -base64 32
```

Or use this online: https://generate-secret.vercel.app/32

## MongoDB Setup

1. Create a free MongoDB Atlas account: https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string
4. Replace the MONGODB_URI value above with your connection string
