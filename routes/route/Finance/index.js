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

/**
 * 获取 资讯（财联社） 数据
 */
const clsNewsData = {
  data: [],
  updatedCount: 0
}
const getClsNews = async (symbol = '全部') => {
  const result = await axios.get(`${AKShareServiceURL}/stock/news/cls?symbol=${symbol}`)
  if (result.data?.data.length) {
    // 数据清洗
    const clsNews = await handleClsNews(result.data.data)
    if (!clsNewsData.data.length) {
      clsNewsData.data = clsNews
      clsNewsData.updatedCount = clsNews.length
    } else {
      const lastNewsTime = clsNewsData.data[0]['发布时间']
      const lastNewsIndex = clsNews.findIndex(item => item['发布时间'] === lastNewsTime)
      if (lastNewsIndex > 0) {
        clsNewsData.data = clsNews.slice(0, lastNewsIndex).concat(clsNewsData.data)
        clsNewsData.updatedCount = lastNewsIndex
      } else {
        clsNewsData.updatedCount = 0
      }
    }
  }
}
// 处理 cls 数据
const handleClsNews = async (rawData) => {
  rawData.reverse()
  let uniqueData = []
  let seenTimestamps = new Set();
  for (let item of rawData) {
    // 判断条件
    const condition = !seenTimestamps.has(item['发布时间']) && !item['标题'].includes('盘中宝') && !item['标题'].includes('电报解读')
    // 如果为真
    if (condition) {
      item['内容'] = item['内容'].replace(item['标题'], '').replace('【】', '').replace(/财联社\d{1,2}月\d{1,2}日电，/g, '').trim()
      uniqueData.push(item);
      seenTimestamps.add(item['发布时间']);
    }
  }
  return uniqueData
}

router.get('/news/cls', async (ctx, next) => {
  ctx.body = {
    code: 200,
    data: clsNewsData.data,
    count: clsNewsData.updatedCount,
  }
  clsNewsData.updatedCount = 0
})

/**
 * 定时执行 爬取 资讯（财联社） 数据
 */
const clsNewsTimer = setInterval(async () => {
  await getClsNews()
}, 1000 * 60)
getClsNews()

module.exports = router;

