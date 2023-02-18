const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server Running at localhost://3000"));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const userGetQuery = `
    SELECT *
    FROM user
    WHERE username='${username}'`;
  const dbUser = await db.get(userGetQuery);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    let passwordLength = request.body.password.length;
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const insertQuery = `
        INSERT INTO user(username,name,password,gender,location)
        VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(insertQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUser = `
    SELECT *
    FROM user
    WHERE username='${username}';`;
  const dbUser = await db.get(getUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const getUser = `
    SELECT *
    FROM user
    WHERE username='${username}';`;
  const dbUser = await db.get(getUser);
  const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordMatch === true) {
    let newPasswordLength = newPassword.length;
    if (newPasswordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updateQuery = `
            UPDATE user
            SET password='${hashedPassword}'
            WHERE username='${username}';`;
      await db.run(updateQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
