# Code Vault 🚀

Code Vault is the ultimate spaced-repetition based code tracking system designed for developers mastering Data Structures and Algorithms (DSA). It helps you track your journey, review problems at optimal intervals, and visualize your progress with detailed analytics.

## ✨ Features

- **Spaced Repetition System (SRS)**: Smart review scheduling (3, 7, 15, 30 days) to combat the forgetting curve.
- **Problem & Solution Management**:
  - Add problems with links, difficulty, topics, and tags.
  - Write and store multiple solutions (Brute Force, Optimized) for each problem.
  - Syntax highlighting for multiple languages (JS, Python, C++, Java, etc.).
- **Detailed Analytics**:
  - Visualize difficulty distribution (Easy/Medium/Hard).
  - Track topic mastery (Arrays, DP, Graphs, etc.).
  - View activity and submission history.
- **Advanced Dashboard**:
  - Filter by difficulty, topic, tag, or search by name.
  - Quick status updates and "Mark as Reviewed" functionality.
- **Profile Management**:
  - Update username and changes reflect instantly across the app.
  - Reset progress ("Danger Zone") with confirmation for a fresh start.
- **Modern UI/UX**:
  - Premium Glassmorphism design with dark mode.
  - Responsive layout for mobile and desktop.
  - Real-time notifications for due reviews.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons
- **Language**: TypeScript

## 🚀 Getting Started

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/code-vault.git
   cd code-vault
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root directory and add:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Open the app**:
   Visit [http://localhost:3000](http://localhost:3000) to start tracking!
