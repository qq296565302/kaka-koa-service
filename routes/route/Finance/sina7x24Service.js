/**
 * 新浪7x24服务
 * 负责获取、处理和缓存新浪财经数据
 */
const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const wsManager = require("../../../utils/websocketManager");


// 新闻数据缓存
const sina7x24Data = {
  data: [],
  updatedCount: 0,
  lastFetchTime: null,
};
// 定时获取数据的间隔时间（2分钟）
const FETCH_INTERVAL = 2 * 60 * 1000;
// 定时器引用
let sina7x24Timer = null;

/**
 * 获取新浪财经数据
 * @returns {Promise<Array>} - 新浪财经数据
 */
const getSina7x24 = async () => {
  try {
    const response = await axios.get(`${AKShareServiceURL}/stock_info_global_sina`);
    if (!response.data || !Array.isArray(response.data)) {
      console.error("获取新浪财经数据格式错误:", response.data);
      return [];
    }
    const lastNewsTime = sina7x24Data.data[0]?.["时间"] || "";
    const lastNewsIndex = response.data.findIndex((item) => item["时间"] === lastNewsTime);
    // 更新数据和计数
    if (lastNewsIndex > 0) {
      // 有新数据，将新数据添加到现有数据前面
      sina7x24Data.data = response.data.slice(0, lastNewsIndex).concat(sina7x24Data.data);
      sina7x24Data.updatedCount = lastNewsIndex; // 新增的数量就是到上次最新数据的索引

      // 通过 WebSocket 发送新闻更新通知
      const newNews = response.data.slice(0, lastNewsIndex);
      wsManager.broadcast({
        type: 'sina7x24_news_update',
        data: {
          count: lastNewsIndex,
          newNews: newNews,
          updateTime: new Date().toISOString()
        }
      });
    } else if (lastNewsIndex === -1) {
      // 没有找到匹配的时间戳，说明全部都是新数据
      sina7x24Data.data = response.data;
      sina7x24Data.updatedCount = response.data.length;
      // 通过 WebSocket 发送新闻更新通知
      wsManager.broadcast({
        type: 'sina7x24_news_update',
        data: {
          count: response.data.length,
          newNews: response.data,
          updateTime: new Date().toISOString()
        }
      });
    } else {
      // lastNewsIndex === 0，没有新数据
      sina7x24Data.updatedCount = 0;
    }

    sina7x24Data.lastFetchTime = new Date();

    console.log(`成功获取新浪财经数据: ${response.data.length} 条, 新增 ${sina7x24Data.updatedCount} 条`);
    return response.data; // 只返回响应数据，而不是整个响应对象
  } catch (error) {
    console.error("获取新浪财经数据失败:", error.message);
    return [];
  }
};

/**
 * 获取当前缓存的新浪财经数据
 */
const getSina7x24Data = () => {
  return {
    data: sina7x24Data.data,
    count: sina7x24Data.updatedCount,
    lastUpdate: sina7x24Data.lastFetchTime,
  };
};

/**
 * 重置更新计数
 */
const resetSinaUpdateCount = () => {
  sina7x24Data.updatedCount = 0;
};

/**
 * 检查数据是否需要更新
 * @param {number} staleTimeMs - 数据过期时间（毫秒）
 * @returns {boolean} 如果数据需要更新则返回true
 */
const isSinaDataStale = (staleTimeMs = 5 * 60 * 1000) => {
  const now = new Date();
  return !sina7x24Data.lastFetchTime || now - sina7x24Data.lastFetchTime > staleTimeMs;
};

/**
 * 启动定时获取新浪财经数据的任务
 */
const startSina7x24Timer = () => {
  if (sina7x24Timer) {
    clearInterval(sina7x24Timer);
  }

  // 初始化获取数据
  getSina7x24().catch((err) => console.error("初始化获取新浪财经数据失败:", err.message));

  // 设置定时任务
  sina7x24Timer = setInterval(async () => {
    await getSina7x24();
  }, FETCH_INTERVAL);

  // 确保在应用关闭时清除定时器
  process.on("SIGINT", () => {
    clearInterval(sina7x24Timer);
  });
};


module.exports = {
  getSina7x24,
  getSina7x24Data,
  startSina7x24Timer,
  isSinaDataStale,
  resetSinaUpdateCount
};