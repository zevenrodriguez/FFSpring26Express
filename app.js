var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('hbs');//added
const fs = require('fs');
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');
var dotenv = require('dotenv').config();

const dbUrl = process.env.NODE_ENV === 'production'
  ? process.env.DATABASE_URL_PROD
  : process.env.DATABASE_URL_LOCAL;




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

//sqlite setup
// //Setup out database
//  const dataDirectory = path.join(__dirname, 'data');
// const storage = path.join(dataDirectory, 'database.sqlite');

// //Ensure the data directory exists
// fs.mkdirSync(dataDirectory, { recursive: true });

// const sequelize = new Sequelize({
//   dialect: 'sqlite',
//   storage,
//   logging:false
// });

//postgres setup
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});


//once added you'll have to delete the database.sqlite file to reset the database and create the new tables with the new models
const List = sequelize.define('List', {
  name: { type: DataTypes.STRING, allowNull: false },
});

const Task = sequelize.define('Task',{
  name:{type: DataTypes.STRING,allowNull:false},
  description:{type: DataTypes.TEXT}
});

// 1. A List can contain multiple Tasks
List.hasMany(Task, {
  onDelete: 'CASCADE'   // If a List is deleted, delete its Tasks
});

// 2. A Task belongs to a single List
Task.belongsTo(List);

// Define Poll model (kept inline for simplicity)
const Poll = sequelize.define('Poll', {
  color: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
});

async function syncDB(){
  await sequelize.sync();
}

syncDB().catch(console.error);

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
    res.json(created);
  }catch(err){
    next(err);
  }
});

app.get('/tasks', async function(req,res,next){
  try{
    const tasks = await Task.findAll({order:[['createdAt','DESC']]});
    //res.json(tasks);
    res.render('tasks',{title:'Tasks', tasks});
  }catch(err){
    next(err);
  }
});

app.get('/tasks/:id/delete', async function(req,res,next){
  try{
    await Task.destroy({where:{id:req.params.id}});
    res.redirect('/tasks');
  }catch(err){
    next(err);
  }
});

app.get('/addlist', function (req, res, next) {
  res.render('addlist', { title: 'Add List' });
});


app.get('/lists/all', async function (req, res, next) {
  try {
    const lists = await List.findAll({ include: [Task], order: [['createdAt', 'DESC']] });
    res.json(lists);
  } catch (err) {
    next(err);
  }
});



app.post('/addlist', async function (req, res, next) {
  console.log('Received addlist POST:', req.body);
  try {
        // req.body is now the clean JSON object
        const list = await List.create(req.body, {
            include: [Task]
        });
        res.json(list);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});



/* GET single-chart route */
app.get('/chart', async function (req, res, next) {
  //res.render('charts', { title: 'Chart' });
  try {
    const poll = await Poll.findAll({ order: [['createdAt', 'DESC']] });


    // render an HTML page with the tasks
    res.render('chart', { title: 'Chart', poll, pollJSON: JSON.stringify(poll) });
  } catch (err) {
    next(err);
  }
});

/* POST chart form handler: increment existing color entry or create it, then redirect to /chart */
app.post('/chart', async function (req, res, next) {
  try {
    const color = req.body.color;
    if (!color) return res.redirect('/chart');
    // Find existing entry for this color
    const existing = await Poll.findOne({ where: { color } });
    if (existing) {
      // increment and save
      //existing.amount = (existing.amount || 0) + 1;
      if (existing.amount) {
        // If 'existing.amount' exists and is not 0 (it's "truthy")
        existing.amount = existing.amount + 1;
      } else {
        // If 'existing.amount' is missing (undefined) or 0 (it's "falsy")
        existing.amount = 1;
      }
      await existing.save();
    } else {
      // create new entry with amount 1
      await Poll.create({ color, amount: 1 });
    }
    // redirect back to the chart page
    res.redirect('/chart');
  } catch (err) {
    next(err);
  }
});

app.get('/p5js', async function (req, res, next) {
  //res.render('p5js', { title: 'p5js' });
  try {
    const poll = await Poll.findAll({ order: [['createdAt', 'DESC']] });


    // render an HTML page with the tasks
    res.render('p5js', { title: 'p5js', pollJSON: JSON.stringify(poll) });
  } catch (err) {
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