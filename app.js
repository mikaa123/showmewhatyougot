var express = require('express'),
  app = express();

var server = app.listen(process.env.PORT || 5000);

app.use(express.static(__dirname + '/public'));