const express = require("express");
const bcrypt = require("bcrypt");
var crypto = require("crypto");
var cors = require("cors");
const bodyParser = require("body-parser");
var mongoose = require("mongoose");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 8000;

app.use(bodyParser.json());
app.use(cors());

const mongoURI = process.env.MONGO_DB_URL;

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("- Successfully connected to db!");
  });

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const binSchema = new mongoose.Schema({
  body: String, // bin content
  pwHash: String, // hash of bin password (can be null)
});
const Bin = mongoose.model("Bin", binSchema);

const generateHashSync = (text) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(text, salt);
  return hash;
};

// TODO: Move helper functions to another module
function dataEncrypt(password, text) {
  var cipher = crypto.createCipher("aes192", password);
  var encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function dataDecrypt(password, encrypted) {
  var decipher = crypto.createDecipher("aes192", password);
  var decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// READ BIN
// (this is POST because GET won't accept req body)
app.post("/readbins/", (req, res) => {
  const id = req.body.id;
  const password = req.body.password;

  if (!id) {
    res.json({ error: "No id given" });
  } else {
    Bin.findById(id, (err, binData) => {
      if (err) {
        res.json({ error: "Error" });
      } else if (binData) {
        if (binData.pwHash) {
          if (!password) {
            res.json({ error: "Password is required" });
          } else if (bcrypt.compareSync(password, binData.pwHash)) {
            // TODO: A note about encryption: here, password and password hash are only used
            // for authorization to the bin content, so bcrypt probably adds a redundant layer:
            // keeping {is_password_protected: Boolean, bodyHash: string} should be sufficient
            const { body: encryptedBody } = binData;
            const decryptedBody = dataDecrypt(password, encryptedBody);

            res.json({
              ...binData,
              body: decryptedBody,
            });
          } else {
            res.json({ error: "Wrong password" });
          }
        } else {
          res.json({
            ...binData,
            body: dataDecrypt(
              process.env.DEFAULT_ENCRYPTION_PASSWORD,
              binData.body
            ),
          });
        }
      } else {
        res.json({ error: "Bin not found" });
      }
    });
  }
});

// CREATE BIN
app.post("/bins/", async (req, res) => {
  if (!req.body) {
    res.json({ error: "body is required" });
  }

  const body = req.body.body;
  const password = req.body.password;

  if (!body) {
    res.json({ error: "Body is required" });
  } else {
    const newBin = new Bin({
      // IF password was not given by user, use default password to encrpyt
      body: dataEncrypt(
        password || process.env.DEFAULT_ENCRYPTION_PASSWORD,
        body
      ),
      pwHash: password ? generateHashSync(password) : null,
    });

    try {
      await newBin.save();

      res.json({
        id: newBin._id,
        body: newBin.body,
        pwHash: newBin.pwHash,
      });
    } catch (dbErr) {
      res.json({ error: "Database related error" });
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
