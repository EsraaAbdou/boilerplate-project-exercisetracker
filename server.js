const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

// schemas
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {type: String, unique: true},
  exercises: [{
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: {type: String, required: true}
  }]
});
const User = mongoose.model('User', UserSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {
  const username = req.body.username;
  User.findOne({username: username}, (err, foundUser) => {
    if(foundUser) {
      res.send("Username already taken");
    } else {
      const user = new User({username: username});
      user.save((err, data) => {
        res.json({username: data.username, _id: data._id});
      });
    }
  });
});

app.get('/api/exercise/users', (req, res) => {
  User.find((err, data) => {
    if(data) res.json(data);
  });
});

app.post('/api/exercise/add', (req, res) => {
  // const regEx = /^\d{4}-\d{2}-\d{2}$/;
  // const date = (req.body.date.match(regEx)) ? new Date(req.body.date): new Date();
  let date = new Date(req.body.date);
  if (isNaN(date.getTime())) date = new Date(); 
  console.log(date)
  const exercise = {description: req.body.description, duration: req.body.duration, date: date.toDateString()};
  User.findByIdAndUpdate(req.body.userId, {$push: {exercises: exercise}}, {new: true, upsert: true}, (err, data) => {
    console.log(date);
    res.json(data);
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
