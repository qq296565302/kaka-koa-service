/**
 * 财联社新闻服务
 * 负责获取、处理和缓存财联社新闻数据
 */
const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const wsManager = require("../../../utils/websocketManager");

/**
 * 财联社新闻相关常量和配置
 */
// 定义需要排除的关键词列表
const EXCLUDED_KEYWORDS = ["盘中宝", "电报解读", "掘金行业龙头"];
// 新闻数据缓存
const clsNewsData = {
  data: [],
  updatedCount: 0,
  lastFetchTime: null,
};
// 定时获取数据的间隔时间（2分钟）
const FETCH_INTERVAL = 2 * 60 * 1000;
// 定时器引用
let clsNewsTimer = null;

/**
 * 处理财联社新闻数据
 * @param {Array} rawData - 原始新闻数据
 * @returns {Array} - 处理后的新闻数据
 */
const handleClsNews = (rawData) => {
  const seenTimestamps = new Set();

  return rawData.reverse().filter((item) => {
    const { 发布日期: publishDate, 发布时间: publishTime, 标题: title, 内容: content } = item;
    
    // 合并日期和时间，并转换为时间戳
    const combinedDateTime = `${publishDate.split('T')[0]}T${publishTime}`;
    const timestamp = new Date(combinedDateTime).getTime();
    
    // 将时间戳添加到数据中
    item['发布时间'] = timestamp;
    
    // 分解条件为具有语义的变量
    const isNewTimestamp = !seenTimestamps.has(timestamp);
    const isValidTitle = EXCLUDED_KEYWORDS.every((keyword) => !title.includes(keyword));

    if (isNewTimestamp && isValidTitle) {
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

/**
 * 获取财联社新闻数据
 * @param {string} symbol - 股票代码，默认为"全部"
 * @returns {Promise<void>}
 */
const getClsNews = async (symbol = "全部") => {
  try {
    const url = `${AKShareServiceURL}/stock_info_global_cls?symbol=${symbol}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (!response.data || !Array.isArray(response.data)) {
      console.error("获取财联社新闻数据格式错误:", response.data);
      return;
    }

    const clsNews = handleClsNews(response.data);
    const lastNewsTime = clsNewsData.data[0]?.["发布时间"] || "";
    const lastNewsIndex = clsNews.findIndex((item) => item["发布时间"] === lastNewsTime);

    // 更新数据和计数
    if (lastNewsIndex > 0) {
      // 有新数据，将新数据添加到现有数据前面
      clsNewsData.data = clsNews.slice(0, lastNewsIndex).concat(clsNewsData.data);
      clsNewsData.updatedCount = lastNewsIndex; // 新增的数量就是到上次最新数据的索引
      
      // 通过 WebSocket 发送新闻更新通知
      const newNews = clsNews.slice(0, lastNewsIndex);
      wsManager.broadcast({
        type: 'cls_news_update',
        data: {
          count: lastNewsIndex,
          newNews: newNews,
          updateTime: new Date().toISOString()
        }
      });
    } else if (lastNewsIndex === -1) {
      // 没有找到匹配的时间戳，说明全部都是新数据
      clsNewsData.data = clsNews;
      clsNewsData.updatedCount = clsNews.length;
      
      // 通过 WebSocket 发送新闻更新通知
      wsManager.broadcast({
        type: 'cls_news_update',
        data: {
          count: clsNews.length,
          newNews: clsNews,
          updateTime: new Date().toISOString()
        }
      });
    } else {
      // lastNewsIndex === 0，没有新数据
      clsNewsData.updatedCount = 0;
    }
    
    clsNewsData.lastFetchTime = new Date();

  } catch (error) {
    console.error("获取财联社新闻数据失败:", error.message);
  }
};

/**
 * 获取当前缓存的财联社新闻数据
 * @returns {Object} 包含新闻数据、更新计数和最后更新时间的对象
 */
const getClsNewsData = () => {
  return {
    data: clsNewsData.data,
    count: clsNewsData.updatedCount,
    lastUpdate: clsNewsData.lastFetchTime,
  };
};

/**
 * 重置更新计数
 */
const resetUpdateCount = () => {
  clsNewsData.updatedCount = 0;
};

/**
 * 检查数据是否需要更新
 * @param {number} staleTimeMs - 数据过期时间（毫秒）
 * @returns {boolean} 如果数据需要更新则返回true
 */
const isDataStale = (staleTimeMs = 5 * 60 * 1000) => {
  const now = new Date();
  return !clsNewsData.lastFetchTime || now - clsNewsData.lastFetchTime > staleTimeMs;
};

/**
 * 启动定时获取财联社新闻数据的任务
 */
const startClsNewsTimer = () => {
  if (clsNewsTimer) {
    clearInterval(clsNewsTimer);
  }
  
  // 初始化获取数据
  getClsNews().catch((err) => console.error("初始化获取财联社新闻数据失败:", err.message));
  
  // 设置定时任务
  clsNewsTimer = setInterval(async () => {
    await getClsNews();
  }, FETCH_INTERVAL);
  
  // 确保在应用关闭时清除定时器
  process.on("SIGINT", () => {
    clearInterval(clsNewsTimer);
  });
};

/**
 * 停止定时获取财联社新闻数据的任务
 */
const stopClsNewsTimer = () => {
  if (clsNewsTimer) {
    clearInterval(clsNewsTimer);
    clsNewsTimer = null;
  }
};

module.exports = {
  getClsNews,
  getClsNewsData,
  resetUpdateCount,
  isDataStale,
  startClsNewsTimer,
  stopClsNewsTimer
};
