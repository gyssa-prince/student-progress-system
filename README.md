# Student Progress System

A full-stack web application to track and visualize Codeforces progress for students, including contest history, problem-solving stats, and automated inactivity email reminders.

---

## Features

- **Student Management:** Add, edit, delete, and view students.
- **Codeforces Sync:** Automatically fetches and updates Codeforces profile, contest, and problem-solving data daily.
- **Progress Dashboard:** Visualizes contest history, rating changes, problem-solving stats, and submission heatmap.
- **Inactivity Reminders:** Sends automated email reminders to inactive students.
- **Dark/Light Mode:** Toggle between dark and light themes.

---

## Tech Stack

- **Frontend:** React, Tailwind CSS, Recharts, React Heatmap Grid
- **Backend:** Node.js, Express, Mongoose, Nodemailer, node-cron
- **Database:** MongoDB (local or Atlas/cloud)

---

## Setup Instructions

### 1. Clone the Repository

```sh
git clone <your-repo-url>
cd student-progress-system
```

### 2. Install Dependencies

#### Backend

```sh
cd server
npm install
```

#### Frontend

```sh
cd ../client
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `server` directory:

```
MONGO_URI=your_mongodb_connection_string
PORT=5050
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
```

- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833?hl=en).

### 4. Start the Application

#### Backend

```sh
cd server
npm run dev
```

#### Frontend

```sh
cd ../client
npm start
```

- The frontend runs on [http://localhost:3000](http://localhost:3000)
- The backend runs on [http://localhost:5050](http://localhost:5050)

---

## Usage

### Student Management

- **Add Student:** Click "+ Add Student" and fill in the details (name, email, phone, Codeforces handle).
- **Edit/Delete:** Use the edit and delete buttons in the student table.
- **View Profile:** Click the "eye" icon to view a student's detailed dashboard.
- **Export:** Download all student data as CSV.

### Dashboard Features(Student Profile)

- **Contest History:** View all Codeforces contests, rating changes, and ranks.
- **Problem Solving Data:** See total solved, most difficult problem, average rating, and daily averages.
- **Submission Heatmap:** Visualizes activity over the last 90 days.

### Automated Sync & Reminders

- **Daily Sync:** Codeforces data is automatically fetched and updated for all students every day at 2 AM (server time).
- **Inactivity Emails:** Students who have not solved any problems in the last 7 days receive an automatic reminder email.

---

## Project Structure

```
student-progress-system/
  client/        # React frontend
  server/        # Express backend
  README.md
```

---

## License

MIT

---

## Credits

- Codeforces API
- React, Tailwind CSS, Recharts, Node.js, Express, Mongoose, Nodemailer

---

**For any issues or contributions, please open an issue or pull