var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('hbs');//added
const fs = require('fs');
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');
const Database = require('better-sqlite3');

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

//Registering Partials
hbs.registerPartials(path.join(__dirname, 'views', 'partials'))
hbs.registerPartial('partial_name', 'partial value');

//Setup out database
const storage = path.join(__dirname,'..','data','database.sqlite');

const sequelize = new Sequelize({
  dialect:'sqlite',
  dialectModule: Database,
  storage,
  logging:false
});



const Task = sequelize.define('Task',{
  name:{type: DataTypes.STRING,allowNull:false},
  description:{type: DataTypes.TEXT}
});

async function syncDB(){
  await sequelize.sync();
}

syncDB();

/* GET home page. */
app.get('/', function (req, res, next) {
  res.render('index', { title: 'Miami' });
});

app.get('/page2', function (req, res, next) {
  res.render('index', { title: 'Page 2' });
});

app.get('/form', function (req, res, next) {
  res.render('form', { title: 'form' });
});

app.post('/form', function(req,res,next){
  console.log(req.body.firstname);
  //res.render('formresponse',{firstname:req.body.firstname,lastname:req.body.lastname});
  res.render('formresponse',req.body);
});

app.get('/guess', function (req, res, next) {
  res.render('guess', { title: 'form' });
});

app.post('/guess', function(req,res,next){
  console.log(req.body.guess);
  let randomNumber = Math.floor(Math.random() * 10);
  console.log(randomNumber);
  let response = "";
  if(randomNumber == Number(req.body.guess)){
    console.log("you guessed correctly");
    response = "you guessed correctly";
  }else{
    console.log("you guessed poorly!");
    response = "you guessed poorly";
  }

  let templateResponse = {guess: req.body.guess, responsetext:response}

  //res.render('formresponse',{firstname:req.body.firstname,lastname:req.body.lastname});
  res.render('guessresponse',templateResponse);
});



app.get('/addtask',function(req,res,next){
  res.render('addtask',{title:'Add Task'});
});

app.post('/addtask', async function(req,res,next){
  try{
    const created = await Task.create({name:req.body.name, description: req.body.description});
    res.json(req.body);
  }catch(err){
    next(err);
  }
});

app.get('/:name', function (req, res, next) {
  console.log(req);
  res.render('index', { title: req.params.name });
});




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;