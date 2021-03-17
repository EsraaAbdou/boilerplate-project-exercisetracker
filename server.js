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
  username: {type:String, unique: true}
});
const User = mongoose.model('User', UserSchema);

const ExerciseSchema = new Schema({
  userId: {type: Number, required: true},
  description: {type: String, required: true},
  duration: {type: String, required: true},
  date: {type:Date, required: true}
});
const Exercise = mongoose.model('Exercise', ExerciseSchema);

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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
