const Router = require("koa-router");
const router = new Router()

// 模块路由前缀
router.prefix("/finance");

router.get("/", function(ctx, next) {
  ctx.body = "this a finance response!";
});

/**
 * 调用 AKShare 接口 
 */
const axios = require("axios");
const AKShareServiceURL = 'http://127.0.0.1:5000/api'

router.get("/akshare", async (ctx, next) => {
  // 获取查询参数
  const { func } = ctx.query;
  if (!func) {
    ctx.body = {
      code: 500,
      msg: "func is required!",
    };
    return;
  }
  const result = await axios.get(`${AKShareServiceURL}/stock?func=${func}`)
  ctx.body = result.data
});

/**
 * 获取 个股信息 数据
 */
router.get('/stockInfo', async (ctx, next) => {
  const { symbol } = ctx.query;
  const result = await axios.get(`${AKShareServiceURL}/stock/individual?symbol=${symbol}`)
  ctx.body = result.data
})

/**
 * 获取 实时行情 数据
 */
router.get('/realTimeQuotes', async (ctx, next) => {
  const { symbol } = ctx.query;
  const result = await axios.get(`${AKShareServiceURL}/stock/quote?symbol=${symbol}`)
  ctx.body = result.data
})

module.exports = router;

