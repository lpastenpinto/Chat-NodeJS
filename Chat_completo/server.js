var bodyParser  = require('body-parser');
var express     = require('express');
var app         = express();
var http        = require('http').Server(app);
var io          = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient;
var userDAO     = require('./dao/UsersDAO').UserDAO;
var messageDAO  = require('./dao/MessagesDAO').MessageDAO;

// Para acceder a los parametros de las peticiones POST
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
/* Mongodb config */
var mdbconf = {
  host: process.env.MONGODB_PORT_27017_TCP_ADDR || '52.1.246.135',
  port: '27017',
  db: 'Chat'
};
/*
var mdbconf = {
  host: '127.0.0.1',
  port: '27017',
  db: 'Chat'
};*/

var mongodbURL = 'mongodb://' + mdbconf.host + ':' + mdbconf.port + '/' + mdbconf.db;
if (process.env.OPENSHIFT_MONGODB_DB_URL) {
  mongodbURL = process.env.OPENSHIFT_MONGODB_DB_URL
}

/* Get a mongodb connection and start application */
MongoClient.connect(mongodbURL, function (err, db) {
  
 
  if (err) return new Error('Connection to mongodb unsuccessful');

  var usersDAO = new userDAO(db); // Initialize userDAO
  var messagesDAO = new messageDAO(db);
  var onlineUsers = [];
  
  
/** *** *** ***
 *  Configuramos el sistema de ruteo para las peticiones web:
 */
  
  app.get('/signup', function (req, res) {
    res.sendFile( __dirname + '/views/signup.html');
  });
  
  app.post('/signup', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email    = req.body.email;
    
    usersDAO.addUser(username, password, email, function (err, user) {
      if (err) {
        res.send({ 'error': true, 'err': err});
      }
      else {
        
        res.send({ 'error': false, 'user': user });
      }
    });
  });

  app.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    
    usersDAO.validateLogin(username, password, function (err, user) {
      if (err) {
        res.send({'error': true, 'err': err});
      }
      else {
        user.password = null;
        res.send({ 'error': false, 'user': user});
      }
    });
  });
  
  /** css and js request */
  app.get('/css/foundation.min.css', function (req, res) {
    res.sendFile(__dirname + '/views/css/foundation.min.css');
  });

  app.get('/css/normalize.css', function (req, res) {
    res.sendFile(__dirname + '/views/css/normalize.css');
  });
  
  app.get('/css/chat.css', function (req, res) {
    res.sendFile(__dirname + '/views/css/chat.css');
  });

  app.get('/js/foundation.min.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/foundation.min.js');
  });

  app.get('/js/foundation.offcanvas.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/foundation.offcanvas.js');
  });

  app.get('/js/chat.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/chat.js');
  });
  
  app.get('/js/moment-with-locales.min.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/moment-with-locales.min.js')
  });


  app.get('/img/ico.png', function (req, res) {
    res.sendFile(__dirname + '/views/img/ico.png');
  });

  
  app.get('*', function(req, res) {
    res.sendFile( __dirname + '/views/chat.html');
  });


 
  io.on('connection', function(socket) {
    
    console.log('New user connected');
        
    socket.on('all online users', function () {
      socket.emit('all online users', onlineUsers);
    });
    
   
    socket.on('chat message', function(msg) {
      messagesDAO.addMessage(msg.username, msg.date , msg.message, function (err, nmsg) {
        io.emit('chat message', msg);
      });
    });
    
    
    socket.on('disconnect', function() {
      onlineUsers.splice(onlineUsers.indexOf(socket.user), 1);
      io.emit('remove user', socket.user);
      console.log('User disconnected');
    });
    
    
    socket.on('latest messages', function () {
      messagesDAO.getLatest(50, function (err, messages) {
      if (err) console.log('Error getting messages from history');
        socket.emit('latest messages', messages);
      });
    });

    socket.on('new user', function (nuser) {
      socket.user = nuser;
      onlineUsers.push(nuser);
      io.emit('new user', nuser);
    });
    
  });


  if (process.env.OPENSHIFT_NODEJS_IP && process.env.OPENSHIFT_NODEJS_PORT) {
    http.listen(process.env.OPENSHIFT_NODEJS_PORT, process.env.OPENSHIFT_NODEJS_IP, function() {
      console.log('Listening at openshift on port: ' + process.env.OPENSHIFT_NODEJS_PORT);
    });
  }
  else {
    http.listen(80, function () {
      console.log('Listing on port: 80')
    })
  }

});