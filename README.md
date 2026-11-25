# Personal Website

My really interesting stuff

## Technologies Used

- **Framework**: Next.js
- **Styling**: Tailwind CSS, shadcn
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/RoLO0u/fedun-site.git
   ```
2. Navigate to the project directory:
   ```bash
   cd fedun-site
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure the environment. Use .env.example as a guide
5. Run the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the website.

## Deployment

Production deploys to Vercel from GitHub Actions when code is pushed to `master`; pull requests targeting `master` run a TypeScript check. To configure it:

1. Import the repository into Vercel and configure the production environment variables listed in `.env.example`.
2. Add these GitHub Actions repository secrets under **Settings → Secrets and variables → Actions**:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
3. Push to `master`, or manually run the **CI and Vercel Production Deploy** workflow on `master`.

The workflow builds and deploys with the Vercel CLI. Keep deployment tokens and application environment values in GitHub Secrets or Vercel project settings, never in this public repository.

## Contributing

Feel free to fork the repository and submit pull requests for any improvements or bug fixes.

## License

This project is licensed under the MIT License.