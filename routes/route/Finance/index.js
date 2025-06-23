const Router = require("koa-router");
const router = new Router();
const {
  getClsNewsData,
  resetUpdateCount,
  isDataStale,
  getClsNews,
  startClsNewsTimer
} = require("./clsNewsService"); // 财联社新闻服务
const { getSina7x24, getSina7x24Data, startSina7x24Timer, isSinaDataStale, resetSinaUpdateCount } = require("./sina7x24Service"); // 新浪7x24服务
const { getPublicQuotes, getPublicQuotesHistory, getDcOrderData } = require("./quotesService");
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
  // 如果数据超过5分钟未更新，则立即更新一次
  if (isSinaDataStale()) {
    await getSina7x24();
  }

  ctx.body = {
    code: 200,
    ...getSina7x24Data()
  };
  resetSinaUpdateCount();
});

// 启动新浪财经数据定时获取服务
startSina7x24Timer();

/**
 * 获取指数分时行情数据
 */
router.get("/quotes/intraday", async (ctx) => {
  const data = await getPublicQuotesHistory();
  ctx.body = {
    code: 200,
    data
  };
});


/**
 * 获取公共指数数据
 */
router.get("/quotes/public", async (ctx) => {
  const data = await getPublicQuotes();
  ctx.body = {
    code: 200,
    data
  };
});

/**
 * 获取东财日內分时买卖盘数据
 */
router.get("/quotes/dc-order", async (ctx) => {
  const data = await getDcOrderData();
  ctx.body = {
    code: 200,
    data
  };
});

/**
 * * 赚钱效应分析
 * * 单次返回当前赚钱效应分析数据
 * * 涨跌比：即沪深两市上涨个股所占比例，体现的是市场整体涨跌，占比越大则代表大部分个股表现活跃。
 * * 涨停板数与跌停板数的意义：涨停家数在一定程度上反映了市场的投机氛围。当涨停家数越多，则市场的多头氛围越强。真实涨停是非一字无量涨停。真实跌停是非一字无量跌停。
 */

const { getMarketEffect } = require("./MarketEffect");
router.get("/quotes/market-effect", async (ctx) => {
  const data = await getMarketEffect();
  ctx.body = {
    code: 200,
    data
  };
});

/**
 * * 企业动态
 * * 单次返回当前所有上市公司的动态数据
 */
const { saveCompanyDynamics } = require("./companyDynamicsService");
router.get("/quotes/company-dynamics", async (ctx) => {
  const date = ctx.query.date;
  const data = await saveCompanyDynamics(date);
  ctx.body = {
    code: 200,
    data
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
