const Router = require("koa-router");
const router = new Router();
const { 
  getClsNewsData, 
  resetUpdateCount, 
  isDataStale, 
  getClsNews, 
  startClsNewsTimer 
} = require("./clsNewsService");

// 模块路由前缀
router.prefix("/finance");

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

// 导出路由模块
module.exports = {
  routes: function() {
    return router.routes();
  },
  allowedMethods: function() {
    return router.allowedMethods();
  }
};
