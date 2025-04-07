// app.js
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const websockify = require('koa-websocket');
const wsManager = require('./utils/websocketManager');

const app = websockify(new Koa());
const router = require("./routes/index");

// 使用 bodyParser 中间件
app.use(bodyParser());

// 定义一个简单的路由
router.get('/', async (ctx) => {
  ctx.body = 'Hello, Koa!!';
});

app.use(router.routes(), router.allowedMethods());

// 定义 WebSocket 路由
app.ws.use((ctx) => {
  // 将连接添加到管理器
  wsManager.addConnection(ctx.websocket);
  
  // 监听消息事件
  ctx.websocket.on('message', (message) => {
    // 处理Buffer格式的消息
    let messageContent;
    if (Buffer.isBuffer(message)) {
      messageContent = message.toString('utf8');
      console.log('Buffer转换后的消息:', messageContent);
    } else {
      messageContent = message;
    }
    
    // 回应消息
    ctx.websocket.send(`收到: ${messageContent}`);
  });

  // 监听连接关闭事件
  ctx.websocket.on('close', () => {
    console.log('连接已关闭');
    wsManager.removeConnection(ctx.websocket);
  });
});

// 启动服务器
const PORT = process.env.PORT || 3300;
app.listen(PORT, () => {
  console.log(`Koa 和 WebSocket 服务器已启动，监听端口 ${PORT}`);
});

module.exports = app;
