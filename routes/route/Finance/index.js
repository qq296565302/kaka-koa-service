const Router = require("koa-router");
const router = new Router();
const {
  getClsNewsData,
  resetUpdateCount,
  isDataStale,
  getClsNews,
  startClsNewsTimer
} = require("./clsNewsService"); // 财联社新闻服务
const { getSina7x24,getSina7x24Data } = require("./sina7x24Service"); // 新浪7x24服务
const { getIndexQuotes } = require("./quotesService");
const { getServerTime, getTradeCalendar } = require("./common");
// 模块路由前缀
router.prefix("/finance");

/**
 * 获取服务器时间的路由
 */
router.get("/time", async (ctx) => {
  ctx.body = {
    code: 200,
    data: getServerTime()
  };
});
/**
 * 获取交易日历
 */
router.get("/trade-calendar", async (ctx) => {
  ctx.body = {
    code: 200,
    data: await getTradeCalendar()
  };
});
/**
 * 获取财联社新闻数据的路由
 */
router.get("/news/cls", async (ctx) => {
  // 如果数据超过5分钟未更新，则立即更新一次
  if (isDataStale()) {
    await getClsNews();
  }

  ctx.body = {
    code: 200,
    ...getClsNewsData()
  };
  resetUpdateCount();
});

// 启动财联社新闻数据定时获取服务
startClsNewsTimer();

/**
 * 获取新浪财经数据
 */
router.get("/news/sina", async (ctx) => {
  const data = await getSina7x24();
  console.log('获取新浪财经数据成功',data);
  ctx.body = {
    code: 200,
    data: data
  };
});

/**
 * 获取全指数
 */
router.get("/quotes/all", async (ctx) => {
  const quotes = await getIndexQuotes();
  ctx.body = {
    code: 200,
    data: quotes
  };
});


// 导出路由模块
module.exports = {
  routes: function () {
    return router.routes();
  },
  allowedMethods: function () {
    return router.allowedMethods();
  }
};
