# FFSpring26Express - Node.js Express Sequelize Application

Welcome to your Express application with Sequelize ORM! This project demonstrates how to build a web application using Express framework with SQLite database and Handlebars templating.

## Quick Start

To run this application:

```bash
npm install
npm start
```

The server will start on port 3000 (or the port specified in your environment).

---

## Overview

This application is a Node.js web application using:
- **Express**: Web framework for Node.js
- **Sequelize**: ORM (Object-Relational Mapping) for database operations
- **SQLite**: Lightweight database
- **Handlebars (HBS)**: Templating engine

---

## Application Setup (`app.js`)

### 1. **Dependencies**

```javascript
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('hbs');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');
```

**Key Dependencies:**
- `express`: Web framework for Node.js
- `sequelize`: ORM (Object-Relational Mapping) for database operations
- `hbs`: Handlebars templating engine
- `morgan`: HTTP request logger
- `fs`: File system module for directory operations

---

### 2. **Express Application Configuration**

```javascript
var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Registering Partials
hbs.registerPartials(path.join(__dirname, 'views', 'partials'))
hbs.registerPartial('partial_name', 'partial value');
```

**Middleware Explanation:**
- `logger('dev')`: Logs HTTP requests to the console
- `express.json()`: Parses incoming JSON payloads
- `express.urlencoded({ extended: false })`: Parses URL-encoded form data
- `cookieParser()`: Parses cookies in requests
- `express.static()`: Serves static files from the `public` directory

---

### 3. **Database Setup (Sequelize + SQLite)**

```javascript
// Setup database
const dataDirectory = path.join(__dirname, 'data');
const storage = path.join(dataDirectory, 'database.sqlite');

// Ensure the data directory exists
fs.mkdirSync(dataDirectory, { recursive: true });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false
});

// Define the Task model
const Task = sequelize.define('Task', {
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT }
});

// Sync database (creates tables if they don't exist)
async function syncDB() {
  await sequelize.sync();
}

syncDB().catch(console.error);
```

**Database Configuration Breakdown:**

1. **Storage Location**: Creates a `data` directory and stores `database.sqlite` file inside it
2. **Sequelize Instance**: 
   - `dialect: 'sqlite'`: Uses SQLite database
   - `storage`: Path to the database file
   - `logging: false`: Disables SQL query logging

3. **Task Model Definition**:
   - `name`: String field, required (cannot be null)
   - `description`: Text field, optional
   - Sequelize automatically adds `id`, `createdAt`, and `updatedAt` fields

4. **Database Synchronization**: 
   - `sequelize.sync()` creates tables in the database if they don't exist
   - Called on application startup

---

## Route for Creating Database Entries

### The `/addtask` Route (Complete Flow)

This route demonstrates the complete pattern for creating database entries in your application.

#### **GET Route - Display Form**

```javascript
app.get('/addtask', function(req, res, next) {
  res.render('addtask', { title: 'Add Task' });
});
```

**Purpose**: Renders the HTML form where users can input task data

**Flow**:
1. User navigates to `/addtask`
2. Server renders the `addtask.hbs` template
3. Template displays a form with `name` and `description` fields

---

#### **POST Route - Create Database Entry**

```javascript
app.post('/addtask', async function(req, res, next) {
  try {
    const created = await Task.create({
      name: req.body.name, 
      description: req.body.description
    });
    res.json(created);
  } catch(err) {
    next(err);
  }
});
```

**Purpose**: Receives form data and creates a new Task entry in the database

**Detailed Breakdown**:

1. **Async Function**: Uses `async/await` for asynchronous database operations

2. **Try-Catch Block**: Handles errors gracefully
   - Success: Returns created task as JSON
   - Failure: Passes error to Express error handler

3. **`Task.create()`**: Sequelize method that:
   - Creates a new Task record
   - Inserts it into the database
   - Returns the created object with auto-generated `id`, `createdAt`, `updatedAt`

4. **Request Body Access**: 
   - `req.body.name`: Gets the `name` field from the form
   - `req.body.description`: Gets the `description` field from the form
   - Enabled by `express.urlencoded()` middleware

5. **Response**: 
   - `res.json(created)`: Sends the created task object as JSON response
   - Includes all fields: `id`, `name`, `description`, `createdAt`, `updatedAt`

---

### The HTML Form (addtask.hbs)

```handlebars
<h1>{{title}}</h1>
<form action="/addtask" method="post">
  <label for="task">Task:</label>
  <input type="text" id="name" name="name" required>
  <label for="description">Description:</label>
  <input type="text" id="name" name="description" required>
  
  <button type="submit">Submit</button>
</form>
```

**Form Attributes**:
- `action="/addtask"`: Submits to the POST `/addtask` route
- `method="post"`: Uses HTTP POST method
- `name="name"` and `name="description"`: Field names that become `req.body.name` and `req.body.description`

---

## Complete Data Flow Diagram

```
User Browser                Express Server              Database
     |                            |                         |
     |--GET /addtask----------->  |                         |
     |                            |                         |
     |<--Render addtask.hbs----   |                         |
     |  (HTML form)               |                         |
     |                            |                         |
     |--POST /addtask-----------> |                         |
     |  (name, description)       |                         |
     |                            |--Task.create()--------> |
     |                            |                         |
     |                            |<--Created task object-- |
     |                            |   (with id, timestamps) |
     |<--JSON response-----------  |                         |
     |  (created task)            |                         |
```

---

## Error Handling

```javascript
// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  
  res.status(err.status || 500);
  res.render('error');
});
```

**Error Handling Flow**:
- If `Task.create()` fails (e.g., validation error, database connection issue)
- `next(err)` passes the error to the error handler
- Error page is rendered with appropriate status code

---

## How to Extend This Pattern

To create new database models and routes, follow this pattern:

### 1. **Define a New Model**

```javascript
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false },
  age: { type: DataTypes.INTEGER }
});
```

### 2. **Create GET Route for Form**

```javascript
app.get('/adduser', function(req, res, next) {
  res.render('adduser', { title: 'Add User' });
});
```

### 3. **Create POST Route for Database Entry**

```javascript
app.post('/adduser', async function(req, res, next) {
  try {
    const created = await User.create({
      username: req.body.username,
      email: req.body.email,
      age: req.body.age
    });
    res.json(created);
  } catch(err) {
    next(err);
  }
});
```

### 4. **Create Form Template**

```handlebars
<form action="/adduser" method="post">
  <input type="text" name="username" required>
  <input type="email" name="email" required>
  <input type="number" name="age">
  <button type="submit">Submit</button>
</form>
```

---

## Available Routes

- **`GET /`** - Home page
- **`GET /page2`** - Example page 2
- **`GET /form`** - Form example
- **`POST /form`** - Form submission handler
- **`GET /guess`** - Number guessing game
- **`POST /guess`** - Guess submission handler
- **`GET /addtask`** - Add task form
- **`POST /addtask`** - Create new task in database
- **`GET /:name`** - Dynamic route with parameter

---

## Project Structure

```
FFSpring26Express/
├── app.js                 # Main application file
├── bin/
│   └── www               # Server startup script
├── data/
│   └── database.sqlite   # SQLite database (auto-generated)
├── public/               # Static files (CSS, JS, images)
├── routes/               # Route handlers (if separated)
├── views/                # Handlebars templates
│   ├── partials/        # Reusable template partials
│   ├── addtask.hbs      # Add task form
│   ├── error.hbs        # Error page
│   └── ...
├── package.json          # Project dependencies
└── README.md            # This file
```

---

## Key Takeaways

✅ **Database Setup**: Sequelize is configured with SQLite, and models are defined with DataTypes  
✅ **Route Pattern**: GET route renders form, POST route creates database entry  
✅ **Async/Await**: All database operations use async functions  
✅ **Error Handling**: Try-catch blocks ensure graceful error handling  
✅ **Middleware**: `express.urlencoded()` enables `req.body` access for form data  
✅ **Response**: Created entries are returned as JSON with auto-generated fields

This pattern provides a solid foundation for building CRUD (Create, Read, Update, Delete) applications with Express and Sequelize!

---

## Further Development

This is your starting point! You can:
- Add more models and routes
- Implement user authentication
- Add validation and data sanitization
- Create views to display database records
- Implement update and delete operations
- Deploy to a hosting service

When you're ready, you can publish this branch to create a GitHub repository and share your work!