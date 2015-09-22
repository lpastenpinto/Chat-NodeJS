function MessageDAO(db) {
    
  if (false == (this instanceof MessageDAO)) {
    console.log('WARNING: MessageDAO constructor called without "new" operator');
    return new MessageDAO(db);
  }
  
  var messages = db.collection('messages');
  
  this.addMessage = function (username, date, message, callback) {
    
    var message = {'username': username, 'date': date, 'message': message};
    messages.insert(message, function (err, result) {
      if (err) return callback(err, null);
      
      console.log('Message saved');
      return callback(null, result[0]);
    });
  }
  
  this.getLatest = function (limit, callback) {
    var qryOptions = {
      'sort': [['date', 'desc']],
      'limit': limit
    }
    
    messages.find({}, qryOptions).toArray(function (err, rmessages) {
      if (err) return callback(err, null);
      return callback(null, rmessages);
    });
  }
  
}

module.exports.MessageDAO = MessageDAO;