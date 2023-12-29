const express = require("express");
//  - HEAD
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const process = require("process");
require("dotenv").config();

// - CONFIGURE
mongoose.connect(process.env.MONGO_URI); // - Connect to DB
app.use(bodyParser.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(cors()); // connections to other servers
app.use(express.static("public")); // define style document
// - CREATE MODELs mongoose

// -> define User
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// -> define Exercise
const exerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

// - index.html
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// - GET {data from DB of monogose(serialized)}}
app.get("/api/users", async (req, res) => {
  const users = User.find({});
  await users
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;
  let user = await User.findById(id);
  if (!user) {
    res.send("User not found");
    return;
  }
  const here = {};
  if (from) {
    here.date = { $gte: new Date(from) };
  }
  if (to) {
    here.date = { $lte: new Date(to) };
  }

  console.log(here);

  const exercises = await Exercise.find({
    username: user._id,
  }).limit(+limit);

  const log = exercises.map((exercise) => {
    return {
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    };
  });

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: log,
  });
});

// - POST {data from form of index.html}}
app.post("/api/users", async (req, res) => {
  const newUser = new User({ username: req.body.username });
  await newUser
    .save()
    .then((data) => {
      console.log(data);
      res.json({ username: data.username, _id: data._id });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;
  const user = await User.findById(id);
  const newExercise = new Exercise({
    username: id,
    description,
    duration,
    date: date ? new Date(date) : new Date(),
  });
  await newExercise
    .save()
    .then((data) => {
      res.json({
        username: user.username,
        description: data.description,
        duration: data.duration,
        date: data.date.toDateString(),
        _id: user._id,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

const listener = app.listen(3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
