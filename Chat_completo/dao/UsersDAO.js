var bcrypt = require('bcrypt-nodejs');

function UserDAO(db) {
    
  if (false == (this instanceof UserDAO)) {
    console.log('WARNING: UserDAO constructor called without "new" operator');
    return new UserDAO(db);
  }
   
  var users = db.collection('users');
  
  this.addUser = function (username, password, email, callback) {
        
    users.findOne({'_id': username}, function (err, user) {
      if (err) throw err;
      
      if (user) {
        var user_yet_exist_error = new Error('User yet exists');
        user_yet_exist_error.msg = "User yet exists"
        return callback(user_yet_exist_error, null);
      }
      else {
        
        // Generate password hash
        var salt = bcrypt.genSaltSync();
        var password_hash = bcrypt.hashSync(password, salt);
        
        // Crear el nuevo 'user' con los parametros dados.
        var user = {'_id': username, 'password': password_hash, 'email': email};
        
        // Insertar el nuevo usuario en la base de datos
        users.insert(user, function (err, result) {
          if (err) return callback(err, null);
          
          console.log('Nuevo usuario creado');
          return callback(null, result[0]);
        });
      }
    });
  }
  
  this.validateLogin = function (username, password, callback) {
    
    users.findOne({'_id': username}, function (err, user) {
      if (err) return callback(err, null);
      
      if (user) {
        if (bcrypt.compareSync(password, user.password)) {
          callback(null, user);
        }
        else {
          var invalid_password_error = new Error('Invalid password');
          invalid_password_error.msg = 'Invalid password';
          callback(invalid_password_error, null);
        }
      }
      else {
        var no_such_user_error = new Error('User not found');
        no_such_user_error.msg = 'User not found';
        callback(no_such_user_error, null);
      }
    });
  }
  
}

module.exports.UserDAO = UserDAO;