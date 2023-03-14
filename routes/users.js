var express = require('express');
var router = express.Router();
const Models = require('./../models');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = Models.User;
dotenv.config();

const crypto = require('crypto');

function generateOTP () {
  const otp = crypto.randomBytes(3).toString('hex');
  return otp.toUpperCase();
}

var otp = generateOTP();

console.log(otp);

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/me',
  async (req, res, next) => {
    try
    {
      let token = req.headers[ 'authorization' ].split(" ")[ 1 ];
      let decoded = jwt.verify(token, process.env.SECRET);
      req.user = decoded;
      next();
    } catch (err)
    {
      res.status(401).json({ "msg": "Couldnt Authenticate" });
    }
  },
  async (req, res, next) => {
    let user = await User.findOne({ where: { id: req.user.id }, attributes: { exclude: [ "password" ] } });
    if (user === null)
    {
      res.status(404).json({ 'msg': "User not found" });
    }
    res.status(200).json(user);
  }); 


router.post('/', async (req, res, next) => {
  //res.status(201).json(req.body);
  //add new user and return 201
  const salt = await bcrypt.genSalt(10);
  var usr = {
    name: req.body.name,
    username: req.body.username,
    email: req.body.email,
    password: await bcrypt.hash(req.body.password, salt),
    phone_number: req.body.phone_number
  };
  created_user = await User.create(usr);
  res.status(201).json(created_user);
});


router.post('/login', async (req, res, next) => {
  const user = await User.findOne({ where: { email: req.body.email } });
  if (user)
  {
    const password_valid = await bcrypt.compare(req.body.password, user.password);
    if (password_valid)
    {
      token = jwt.sign({ "id": user.id, "email": user.email, "name": user.name }, process.env.SECRET);
      res.status(200).json({ token: token });
    } else
    {
      res.status(400).json({ error: "Password Incorrect" });
    }

  } else
  {
    res.status(404).json({ error: "User does not exist" });
  }

});



module.exports = router;