const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const catalogRouter = require("./routes/catalog");

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const mongoose=require("mongoose")
mongoose.set("strictQuery", false);
//mongo local :
//const mongoDB = "mongodb://127.0.0.1/my_database";
//mongo enligne:
const mongoDB="mongodb+srv://admin:RyecwFli8f0kELc4@cluster0.shaccof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
async function connection_bd() {
  await mongoose.connect(mongoDB);
} 

connection_bd()
  .then(() => console.log("successfully connected to BD"))
  .catch((err) => console.log(err));

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/catalog", catalogRouter); // Add catalog routes to middleware chain.

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
