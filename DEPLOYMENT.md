# Comic Collection App - Vercel Deployment Guide

This guide will walk you through deploying your Comic Collection App to Vercel with PostgreSQL database.

## Prerequisites

1. [Vercel Account](https://vercel.com/signup)
2. [GitHub Account](https://github.com) (for repository hosting)
3. Your project code pushed to a GitHub repository

## Step 1: Push to GitHub

1. Create a new GitHub repository
2. Push your local code to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave default (`.next`)
   - **Install Command**: `npm install`

## Step 3: Add PostgreSQL Database

1. In your Vercel dashboard, go to your project
2. Navigate to the "Storage" tab
3. Click "Create Database" → "Postgres"
4. Choose a database name (e.g., `comic-collection-db`)
5. Select your preferred region
6. Click "Create"

The following environment variables will be automatically added to your project:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` 
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_DATABASE`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_USER`

## Step 4: Deploy and Initialize Database

1. Vercel will automatically deploy your app
2. The first deployment will:
   - Install dependencies
   - Generate Prisma client
   - Push database schema to PostgreSQL
   - Build the Next.js application

## Step 5: Verify Deployment

1. Visit your deployed app at `https://your-app-name.vercel.app`
2. Test basic functionality:
   - Navigate through the app
   - Try adding a publisher or series
   - Test the LOCG crawler (may take longer on first run)

## Environment Variables

The app uses these environment variables in production:

### Automatically Set by Vercel Postgres:
- `POSTGRES_URL` - Direct PostgreSQL connection
- `POSTGRES_PRISMA_URL` - Connection with pooling for Prisma
- `POSTGRES_URL_NON_POOLING` - Direct connection without pooling

### Optional Custom Variables:
- `NODE_ENV=production` (automatically set by Vercel)

## Local Development with PostgreSQL

To test with PostgreSQL locally:

1. Set up a local PostgreSQL database or use a hosted service
2. Create `.env.local` with your database URLs:

```env
POSTGRES_URL="postgresql://username:password@localhost:5432/comic_collection"
POSTGRES_PRISMA_URL="postgresql://username:password@localhost:5432/comic_collection?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgresql://username:password@localhost:5432/comic_collection"
```

3. Run database migrations:

```bash
npm run db:push
```

4. Start development server:

```bash
npm run dev
```

## Features in Production

✅ **Working Features:**
- Comic collection management (CRUD operations)
- Series and publisher management  
- Wishlist functionality
- Data import/export
- LOCG web crawler (with Vercel-optimized Puppeteer)
- Responsive UI with Tailwind CSS

⚠️ **Differences from Local Version:**
- Uses PostgreSQL instead of SQLite
- LOCG crawler runs in headless mode
- No Electron desktop features
- Serverless function timeouts (max 10 seconds on free tier)

## Troubleshooting

### Build Failures
- Check the "Functions" tab in Vercel dashboard for error logs
- Ensure all environment variables are set correctly
- Verify database connectivity

### Database Issues
- Check Postgres database status in Vercel dashboard
- Verify Prisma schema matches your database structure
- Use Vercel's database browser to inspect data

### LOCG Crawler Issues
- Crawler uses headless Chrome in production
- May timeout on very large series (>1000 issues)
- Check function logs for specific errors

### Performance Optimization
- Enable Vercel Analytics for performance monitoring
- Consider upgrading to Pro plan for better performance
- Use Edge Runtime for faster function execution

## Support

For deployment issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- Check [Prisma with Vercel Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

## Cost Considerations

**Vercel Free Tier Includes:**
- 100GB bandwidth
- 100GB-hours serverless function execution
- 1 concurrent build
- Unlimited static sites

**Vercel Postgres Free Tier Includes:**
- 256MB storage
- 60 hours compute time
- 1,000 requests per day

For higher usage, consider upgrading to Vercel Pro ($20/month) for better performance and higher limits.