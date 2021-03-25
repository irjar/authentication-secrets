A mini version of a whisper app.

There is a home page with Login and Register buttons which allow the user to register/login. 
Once the user has registered/logged in they are able to submit secrets. 

The app uses different authentication methods: 
Level 1: Register users with username and password
Level 2: Database encryption
Level 3: Hashing passwords
Level 4: Salting and hashing passwords with bcrypt
Level 5: Logging in with Google
Level 6: Using OAuth

The web app uses:
- Passport - Local/Google
- Mongoose - MongoDB
- EJS
- Express
- Node.js
- HTML5
- CSS3
- Bootstrap

How to run: (from terminal)
- Clone the repository
- Download the missing dependencies from npm: npm install
- Download, install and run MongoDB
- Register your application to get ID and SECRET keys from Google
- Create .env file
- Run program: node app.js
- Open: http://localhost:3000
