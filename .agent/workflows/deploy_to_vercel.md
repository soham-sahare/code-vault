---
description: How to deploy Code Vault to Vercel
---

# Deploying Code Vault to Vercel

## 1. Prerequisites

- A [Vercel Account](https://vercel.com/signup).
- A [GitHub Account](https://github.com/).
- A **Production MongoDB Database**. Local `mongodb://localhost:27017` will NOT work on Vercel.

## 2. Setup MongoDB Atlas (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create a free M0 Cluster.
3. In "Database Access", create a database user (username/password).
4. In "Network Access", allow access from anywhere (`0.0.0.0/0`) or just allow access from Vercel IPs (easier to just allow all for starter projects).
5. Click "Connect" -> "Drivers" -> Copy the **Connection String**.
   - It will look like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<password>` with your actual password.

## 3. Push to GitHub

Ensure your latest code is pushed to your GitHub repository.

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## 4. Deploy on Vercel

1. Log in to Vercel Dashboard.
2. Click **"Add New..."** -> **"Project"**.
3. Import your `code-vault` repository.
4. **Environment Variables**:
   Expand the "Environment Variables" section and add the following:

   | Name              | Value                                  | Description                                                                 |
   | :---------------- | :------------------------------------- | :-------------------------------------------------------------------------- |
   | `MONGODB_URI`     | `mongodb+srv://...`                    | Your MongoDB Atlas Connection String from Step 2.                           |
   | `NEXTAUTH_SECRET` | `(generate one)`                       | Run `openssl rand -base64 32` in your terminal to generate a secure string. |
   | `NEXTAUTH_URL`    | `https://your-project-name.vercel.app` | (Optional on Vercel) The URL of your deployed site.                         |

5. Click **"Deploy"**.

## 5. Post-Deployment

- Vercel will build your project. Since we verified `npm run build` locally, it should pass!
- Once deployed, visit your new URL.
- **Note**: Your local data will not be there. You are now connected to the Production Cloud Database. You can sign up a new account and start tracking!
