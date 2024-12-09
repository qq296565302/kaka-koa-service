// app.js
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const websockify = require('koa-websocket');

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
  // 监听消息事件
  ctx.websocket.on('message', (message) => {
    console.log('收到消息:', message);
    // 回应消息
    ctx.websocket.send(`收到: ${message}`);
  });

  // 监听连接关闭事件
  ctx.websocket.on('close', () => {
    console.log('连接已关闭');
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Koa 和 WebSocket 服务器已启动，监听端口 ${PORT}`);
});

module.exports = app;
