const Router = require("koa-router");
const router = new Router();

// 模块路由前缀
router.prefix("/finance");

router.get("/", function (ctx, next) {
  ctx.body = "this a finance response!";
});

/**
 * 调用 AKShare 接口
 */
const axios = require("axios");
// ? 京东云服务地址
const AKShareServiceURL = "http://116.196.75.89:5000/api/public";

/**
 * ? 获取 资讯（财联社） 数据
 */
const clsNewsData = {
  data: [],
  updatedCount: 0,
};
const getClsNews = async (symbol = "全部") => {
  try {
    const result = await axios.get(`${AKShareServiceURL}/stock_info_global_cls?symbol=${symbol}`);
    const clsNews = await handleClsNews(result.data);
    const lastNewsTime = clsNewsData.data[0]?.[" "] || "";
    const lastNewsIndex = clsNews.findIndex((item) => item[" "] === lastNewsTime);
    clsNewsData.data = lastNewsIndex > 0 ? clsNews.slice(0, lastNewsIndex).concat(clsNewsData.data) : clsNews;
    clsNewsData.updatedCount = lastNewsIndex > 0 ? lastNewsIndex : 0;
  } catch (error) {
    console.error("Error fetching CLS news:", error);
  }
};
// ? 定义需要排除的关键词列表
const EXCLUDED_KEYWORDS = ["盘中宝", "电报解读", "掘金行业龙头"];
// ? 处理 cls 数据
const handleClsNews = async (rawData) => {
  const seenTimestamps = new Set();

  return rawData.reverse().filter((item) => {
    const { 发布时间: timestamp, 标题: title, 内容: content } = item;

    // ? 分解条件为具有语义的变量
    const isNewTimestamp = !seenTimestamps.has(timestamp);
    const isValidTitle = EXCLUDED_KEYWORDS.every((keyword) => !title.includes(keyword));

    const condition = isNewTimestamp && isValidTitle;

    if (condition) {
      item["内容"] = content
        .replace(title, "")
        .replace("【】", "")
        .replace(/财联社\d{1,2}月\d{1,2}日电，/g, "")
        .trim();
      seenTimestamps.add(timestamp);
      return true;
    }
    return false;
  });
};

router.get("/news/cls", async (ctx, next) => {
  ctx.body = {
    code: 200,
    data: clsNewsData.data,
    count: clsNewsData.updatedCount,
  };
  clsNewsData.updatedCount = 0;
});

/**
 * 定时执行 爬取 资讯（财联社） 数据
 */
const clsNewsTimer = setInterval(async () => {
  await getClsNews();
}, 1000 * 60);
getClsNews();

module.exports = router;
