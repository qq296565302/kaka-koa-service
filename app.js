// app.js
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const websockify = require('koa-websocket');
const wsManager = require('./utils/websocketManager');
const logger = require('./utils/logger');
const { saveState, loadState } = require('./utils/stateStorage');
const eventBus = require('./utils/eventBus');
const { registerAllHandlers } = require('./utils/messageHandlers');
const { handleClientMessage } = require('./utils/messageProcessor');
const { connectDB } = require('./config/db');

const app = websockify(new Koa());
const router = require("./routes/index");

// 使用 bodyParser 中间件
app.use(bodyParser());

// 添加请求日志中间件
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    logger.error(`[${ctx.method} ${ctx.url}] ${err.stack}`);
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
  }
});

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
    } else {
      messageContent = message;
    }

    if(messageContent === 'ping') {
      ctx.websocket.send('ping');
      return;
    }
    
    // 处理客户端消息
    try {
      const response = handleClientMessage(messageContent);
      if (response) {
        ctx.websocket.send(JSON.stringify(response));
      }
    } catch (error) {
      logger.error('处理WebSocket消息失败:', error);
    }
  });

  // 监听连接关闭事件
  ctx.websocket.on('close', () => {
    logger.info('WebSocket 连接已关闭');
    wsManager.removeConnection(ctx.websocket);
  });
});

// 连接到MongoDB数据库
connectDB().then(() => {
  logger.info('应用程序已准备就绪');
}).catch(err => {
  logger.error('应用程序启动失败:', err);
});

// 初始化所有消息处理器
registerAllHandlers();

module.exports = app;
