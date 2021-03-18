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
  let dateObj = new Date(req.body.date);
  if (isNaN(dateObj.getTime())) dateObj = new Date(); 
  const date = dateObj;
  const description = req.body.description;
  const duration = parseFloat(req.body.duration);
  const exercise = {description, duration, date};
  User.findByIdAndUpdate(req.body.userId, {$push: {exercises: exercise}}, {new: true, upsert: true}, (err, data) => {
    if(data) res.json({"_id": data._id, "username": data.username, "date": date.toDateString(), "duration": duration, "description": description});
  })
});

app.get('/api/exercise/log', (req, res) => {
  const userId = req.query.userId;
  const dateFrom = new Date(req.query.from);
  const dateTo = new Date(req.query.to);
  const limit = req.query.limit;

  User.findById(userId)
  .select('-exercises._id -__v')
  .exec((err, data) => {
    if(data){
      // filters
      let logArr = [];
      if(data.exercises) logArr = [...data.exercises];
      logArr.map(log => {
        log.date = new Date(log.date).toDateString();
        return log;
      });

      if(dateFrom && !isNaN(dateFrom.getTime())) logArr = logArr.filter(log => new Date(log.date) >= dateFrom);
      if(dateTo && !isNaN(dateTo.getTime())) logArr = logArr.filter(log => new Date(log.date) <= dateTo);
      if(limit) logArr = logArr.slice(0, limit);

      res.json({'_id': data._id, 'username': data.username, 'count': logArr.length, log: logArr})
    } else {
      res.send("Unknown userId");
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
