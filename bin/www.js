#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('kaka-koa-service:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3300');
// app.set('port', port);

/**
 * Create HTTP server.
 */

// 创建 HTTP 服务器
// 注意：koa-websocket 已经在 app 中集成了 WebSocket 服务器
// 我们需要使用 app.callback() 来创建服务器
var server = http.createServer(app.callback());

// 将 WebSocket 服务器与 HTTP 服务器关联
// 这一步已经在 app.js 中通过 websockify 完成
// 但我们需要确保它们使用相同的服务器实例
// 如果 app.ws.listen 存在，则调用它
if (app.ws && typeof app.ws.listen === 'function') {
  app.ws.listen({ server });
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      //  process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      //  process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log(`服务器已启动，监听端口 ${addr.port}`);
}
