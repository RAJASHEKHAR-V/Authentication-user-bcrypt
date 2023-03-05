// importing express js path

const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

app.use(express.json());

// importing sqlite sqlite3

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

//Initializing database and server
let db = null;

const InitializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};

InitializeDatabaseAndServer();

//API-1 Register user Page

app.post("/register", async (request, response) => {
  //Register details
  const { username, name, password, gender, location } = request.body;

  //encrypt password
  const hashedPassword = await bcrypt.hash(password, 10);
  //checkUser exist query and register user query
  const checkUserExistQuery = `SELECT * FROM user WHERE username ='${username}'`;
  const registerUserQuery = `
    INSERT INTO user(username, name, password, gender, location)
    VALUES('${username}',
    '${name}',
    '${hashedPassword}',
    '${gender}',
    '${location}');`;
  const isUserPresent = await db.get(checkUserExistQuery);
  //check user existence
  if (isUserPresent !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    await db.run(registerUserQuery);
    response.status(200);
    response.send("User created successfully");
  }
});

//User login Page API

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userDetailsQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const userDetailsObject = await db.get(userDetailsQuery);
  if (userDetailsObject === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordIsCorrect = await bcrypt.compare(
      password,
      userDetailsObject.password
    );
    if (isPasswordIsCorrect === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});

//user password update  API

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const userPasswordQuery = `
    SELECT * FROM user WHERE username = '${username}';`;
  const passwordUpdateQuery = `
    UPDATE user
    SET password ='${hashedPassword}';`;
  const userPasswordsDetailsObject = await db.get(userPasswordQuery);
  const isOldPasswordCorrect = await bcrypt.compare(
    oldPassword,
    userPasswordsDetailsObject.password
  );
  if (isOldPasswordCorrect === false) {
    response.status(400);
    response.send("Invalid current password");
  } else if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    await db.run(passwordUpdateQuery);
    response.status(200);
    response.send("Password updated");
  }
});

module.exports = app;
