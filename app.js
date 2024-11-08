// app.js
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

// 使用 bodyParser 中间件
app.use(bodyParser());

// 定义一个简单的路由
router.get('/', async (ctx) => {
  ctx.body = 'Hello, Koa!';
});

app.use(router.routes()).use(router.allowedMethods());

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
