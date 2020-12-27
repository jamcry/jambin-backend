# JamBin Backend!

Node.js API for [jambin-app](https://github.com/jamcry/jambin-app). Uses MongoDB Atlas as database.

---

## Required Env Variables

The following environment variables are needed for app to work:

```env
MONGO_DB_URL="mongodb+srv://<user>:<password>@cluster0.ut..."
DEFAULT_ENCRYPTION_PASSWORD="my_password"
```

- `DEFAULT_ENCRYPTION_PASSWORD` is used to encrypt bin content, if explicit password is not given by the user.
- `MONGO_DB_URL` is the database url that can be obtained from [MongoDB console](https://cloud.mongodb.com/v2#/)

---

## How to run

- It can be run using node directly:
  ```bash
  node app.js
  ```
- Or nodemon package can be used for better dev experience (such as hot reload):
  ```bash
  npm install -g nodemon #install nodemon globally
  nodemon app.js
  ```
