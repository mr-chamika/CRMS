# Consultancy Resource & Skill Management System (CRMS)

**Time Period:** December 2025 - January 2026  
**Status:** Final Submission

---

## 1. Project Overview
The Consultancy Resource & Skill Management System (CRMS) is a full-stack web application designed for tech consultancies. It centralizes personnel data, tracks skills and proficiency levels, and efficiently matches team members to project requirements. This reduces information silos, ensures the right people are assigned to the right projects, and helps managers plan effectively based on staff availability.

---

## 2. Technology Stack
- **Frontend:** React.js  
- **Backend:** Node.js (v20.12.2), Express.js  
- **Database:** MySQL (MariaDB 10.4.28 via XAMPP)  
- **Tools:** Git, Postman  

---

## 3. Prerequisites
- **Node.js:** v18+ (v20.12.2 installed)  
- **MySQL / MariaDB:** v10+ (v10.4.28 via XAMPP)  

---

## 4. Core Features (Required)

### Manager (Current Design Assumes a Single Manager Account)

#### 4.1 Personnel Management
- Create new personnel  
- Update personnel information  
- Delete personnel  
- View personnel list  

#### 4.2 Skill Management
- Add new skills to the catalog  
- Update or delete skills  
- Assign skills to personnel with proficiency levels  

#### 4.3 Project Management
- Create new projects with:
  - Name, description, start/end dates, status  
- Define required skills for each project  
- Update projects  
- Delete projects  

#### 4.4 Basic Matching Algorithm
- Match personnel who have **all required skills**  
- Filter matches by **minimum proficiency level(customizable)**  
- Display results clearly, including:
  - Personnel name and role  
  - Matched skills  
  - Proficiency levels  

---

## 5. Additional Features (Enhancements)

### Manager
- **Utilization Visualization:**  
  - Highlight personnel utilization status (Busy vs Available)  
  - Display utilization percentages(workload have assigned) based on project assignments  

- **Match Scoring / Percentage:**  
  - Calculate a match score based on how many project requirements are satisfied  

- **Optional Sorting / Filtering:**  
  - Sort personnel by experience, skill proficiency, or match score  

- **Secure Password Handling:**  
  - Passwords are hashed using bcrypt  

- **Authentication (Login):**  
  -Note: Manager credentials must be added manually in the database for testing purposes(ex:API Testing Screenshots => Testing 1).
  - Manager login using email and password  
  - **Email verification is not implemented**, as the system is designed for **internal organizational use**  
  - Email verification and OTP based authentication can be added as a future enhancement  

### Employee (Optional / Future)
- View own profile  
- Track assigned projects  
- Update availability or personal information  
- Authentication (Login and Sign Up)
---

## 6. How to Run the System

### Local Environment Setup
1. Clone the repository:
- git clone https://github.com/mr-chamika/CRMS.git
- cd crms

2. Dependency Management:
- cd frontend and in terminal type "npm install", press Enter.
- cd backend and in terminal type "npm install", press Enter.

3. Environment Configuration
- Create a `.env` file in the `backend/` directory with the following variables:
- DB_HOST=localhost
- DB_USER=root
- DB_PASSWORD=
- DB_NAME=db
- PORT=5000
- JWT_SECRET=thisisaverybigseceretfor4bexcompanyassignment
- DB_PORT=3306

4.Database Initialization

- Open your MySQL instance (via Command Line or MySQL Workbench).

- Execute the provided database.sql script found in the root directory.

- This will create the schema, establish foreign key constraints, and insert initial seed data for testing.

5.Execution

- Both frontend and backend terminal's type "npm run dev" and press Enter.

- frontend runs => http://localhost:3000/
- backend runs => http://localhost:5000/