FurniWood is a modern, responsive e-commerce platform for ordering custom-made wooden furniture. It allows users to browse a catalog of high-quality furniture, configure custom orders, and manage their accounts through a user-friendly interface. The project emphasizes a minimalist design, fast performance, and accessibility, making it ideal for users on desktop and mobile devices.

Main Idea
The core idea of FurniWood is to provide a seamless and personalized shopping experience for customers seeking unique wooden furniture. Users can explore products with various wood types and variants, submit custom order inquiries, and securely register or log in to manage their preferences. The platform is designed to be intuitive, visually appealing, and optimized for performance across devices.

Features
Product Catalog: Browse a variety of furniture (e.g., oak tables, cherry bookshelves) with details like wood type, variants, and pricing.
Custom Order Form: Submit inquiries for custom furniture with specific wood types, dimensions, and notes.
User Authentication: Secure registration and login with email/password or Google OAuth (backend integration required).
Responsive Design: Fully optimized for mobile (400px+), tablets (600-1024px), and desktop, including half-screen views.
Accessible Navigation: Mobile-friendly hamburger menu with keyboard support (Enter, Escape) and ARIA attributes.
Optimized Performance: Fast loading with debounced inputs, memoized components, and efficient API calls.
Technologies
Frontend:
React 18 (with Hooks)
React Router DOM (for navigation)
Yup (form validation)
Axios (API requests)
DOMPurify (XSS protection)
CSS (with variables, responsive design)
Backend:
Node.js + Express (REST API)
MongoDB (via MongoDB Atlas for data storage)
Bcrypt (password hashing)
JSON Web Token (JWT for authentication)
Nodemailer (email notifications)
CORS (cross-origin requests)
Tools:
npm (package management)
Git (version control)
Installation
Prerequisites
Node.js (v18 or higher)
MongoDB Atlas account (or local MongoDB instance)
Git
