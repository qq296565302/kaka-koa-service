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
  try {
    const { data } = await axios.get(`${AKShareServiceURL}/stock/news/cls?symbol=${symbol}`)
    const clsNews = await handleClsNews(data.data)
    const lastNewsTime = clsNewsData.data[0]?.[' '] || ''
    const lastNewsIndex = clsNews.findIndex(item => item[' '] === lastNewsTime)
    clsNewsData.data = lastNewsIndex > 0
      ? clsNews.slice(0, lastNewsIndex).concat(clsNewsData.data)
      : clsNews
    clsNewsData.updatedCount = lastNewsIndex > 0 ? lastNewsIndex : 0
  } catch (error) {
    console.error('Error fetching CLS news:', error)
  }
}
// 处理 cls 数据
const handleClsNews = async (rawData) => {
  const seenTimestamps = new Set();
  
  return rawData.reverse().filter(item => {
    const { '发布时间': timestamp, '标题': title, '内容': content } = item;
    const condition = !seenTimestamps.has(timestamp) && !title.includes('盘中宝') && !title.includes('电报解读');
    
    if (condition) {
      item['内容'] = content.replace(title, '').replace('【】', '').replace(/财联社\d{1,2}月\d{1,2}日电，/g, '').trim();
      seenTimestamps.add(timestamp);
      return true;
    }
    return false;
  });
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
