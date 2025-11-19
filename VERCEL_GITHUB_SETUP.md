# Vercel GitHub Integration Setup

This guide explains how Vercel is integrated with GitHub Actions to ensure quality gates before deployment.

## Deployment Strategy

**Important:** Vercel autodeploy should be **DISABLED** to allow GitHub Actions to control deployments.

- ✅ Tests run first in GitHub Actions
- ✅ Deployment only happens if all quality checks pass
- ✅ Full control over when deployments occur
- ✅ Quality gates prevent broken code from being deployed

## Benefits

- ✅ Quality gates: Tests must pass before deployment
- ✅ Controlled deployments via GitHub Actions
- ✅ Consistent deployment process
- ✅ Better visibility of deployment status in GitHub

## Setup Steps

### 1. Connect GitHub Repository in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **ebilly/frontend**
3. Navigate to **Settings** → **Git**
4. If not already connected:
   - Click **Connect Git Repository**
   - Select **GitHub**
   - Authorize Vercel to access your repositories
   - Select the repository: **buddywood/1kappa**
   - Select the root directory: **frontend**
   - Click **Deploy**

### 2. Configure Branch Settings (IMPORTANT: Disable Autodeploy)

1. In **Settings** → **Git**, configure:
   - **Production Branch**: `main` (for production deployments)
   - **Preview Deployments**: Can be enabled for manual deployments
   - **⚠️ IMPORTANT: Disable "Automatic deployments"** - GitHub Actions will handle deployments after tests pass
   
   To disable autodeploy:
   - Go to **Settings** → **Git**
   - Under your connected repository, click the three dots (⋯)
   - Select **Disable Automatic Deployments** or uncheck **Deploy every push**

### 3. Configure Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Ensure all required variables are set for:
   - **Production** environment (for `main` branch)
   - **Preview** environment (for `development` and other branches)

Required variables:
- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- Any other environment variables your app needs

### 4. Enable GitHub Status Checks (Optional but Recommended)

1. In **Settings** → **Git** → **Deploy Hooks**
2. Ensure **GitHub Status Checks** is enabled
3. This will show deployment status directly in GitHub PRs

### 5. Verify Integration

After setup, when you push to GitHub:
- Vercel will automatically start a deployment
- You'll see a deployment status check in your GitHub commit/PR
- The status will update as the deployment progresses

## How It Works

1. **On Push to `development` branch:**
   - GitHub Actions runs quality checks (ESLint, TypeScript, Tests)
   - If all checks pass, GitHub Actions deploys to Vercel (preview)
   - Deployment only happens if tests pass ✅

2. **On Push to `main` branch:**
   - GitHub Actions runs quality checks (ESLint, TypeScript, Tests)
   - If all checks pass, GitHub Actions deploys to Vercel (production)
   - Deployment only happens if tests pass ✅

3. **Quality Gates:**
   - Tests must pass before deployment
   - Failed tests prevent deployment
   - Ensures only tested code reaches production

## Troubleshooting

### Deployment not triggering
- Check that the repository is connected in Vercel Settings → Git
- Verify the branch is configured for auto-deploy
- Check Vercel logs for any errors

### Status not showing in GitHub
- Ensure GitHub integration is properly authorized
- Check that GitHub Status Checks is enabled in Vercel
- Verify you have the correct permissions in the repository

### Environment variables missing
- Go to Vercel Settings → Environment Variables
- Ensure variables are set for the correct environment (Production/Preview)
- Redeploy after adding variables

## Current Workflow

The GitHub Actions workflow (`ci-deploy.yml`) now:
- ✅ Runs quality checks (ESLint, TypeScript, Tests) **FIRST**
- ✅ Runs database migrations
- ✅ Deploys backend to Heroku
- ✅ Deploys frontend to Vercel **ONLY IF** all quality checks pass

This ensures that:
- Tests act as a quality gate
- Broken code never gets deployed
- You have full control over the deployment process
- All deployments go through the same quality checks

