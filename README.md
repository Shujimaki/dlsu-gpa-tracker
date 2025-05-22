# Greendex

A modern, web-based GPA, Grade, and CGPA calculator for De La Salle University (DLSU) students. Inspired by the original Excel tool by Renz Kristofer Cheng (A Not-So-Popular Kid, 2012), Greendex brings a seamless, mobile-friendly, and visually appealing experience to academic tracking.

## Features

- **GPA Calculator**: Input your courses, units, grades, and non-academic subjects. Instantly see your GPA and Dean's List eligibility.
- **Tab-based UI**: Modern browser-style tabs for future expansion (Grade Calculator, CGPA Calculator, Projections, etc.).
- **Mobile Responsive**: Works beautifully on both desktop and mobile.
- **Local Data Persistence**: Your data is saved in your browser (Firebase sync coming soon).
- **DLSU-specific Logic**: Honors, NAS handling, and GPA rules tailored for DLSU.

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (build tool)
- [Tailwind CSS](https://tailwindcss.com/) (styling)
- [Lucide Icons](https://lucide.dev/)
- [Firebase](https://firebase.google.com/) (planned for authentication and cloud sync)

## Getting Started (Local Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/greendex.git
   cd greendex
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment (Vercel)

1. **Push your code to GitHub.**
2. **Sign up at [Vercel](https://vercel.com/)** and import your repo.
3. **Set build command:** `npm run build` and output directory: `dist` (auto-detected for Vite).
4. **Deploy!** Your site will be live on a free `.vercel.app` domain.

## References & Credits

- **Original DLSU GPA & Grade Calculator** by [Renz Kristofer Cheng (A Not-So-Popular Kid, 2012)](https://www.anotsopopularkid.com/2012/12/dlsu-gpa-and-grade-calculator.html)
  - This project is heavily inspired by and based on the logic of Renz's original Excel tool. Please visit and support the original work!
- DLSU Student Handbook and official academic policies
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## License

This project is for educational and personal use. Please credit the original author if you use or modify the GPA logic.

---

**Greendex** is not officially affiliated with De La Salle University. For official academic records and policies, always consult the DLSU Registrar or your college adviser.
