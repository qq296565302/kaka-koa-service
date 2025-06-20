/**
 * * 赚钱效应分析
 * * 单次返回当前赚钱效应分析数据
 * * 涨跌比：即沪深两市上涨个股所占比例，体现的是市场整体涨跌，占比越大则代表大部分个股表现活跃。
 * * 涨停板数与跌停板数的意义：涨停家数在一定程度上反映了市场的投机氛围。当涨停家数越多，则市场的多头氛围越强。真实涨停是非一字无量涨停。真实跌停是非一字无量跌停。
 */
const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const wsManager = require("../../../utils/websocketManager");
const MarketEffect = require("../../../models/MarketEffect");

/**
 * 获取东八区时间
 * @param {Date|string} date 原始日期，如果不提供则使用当前时间
 * @returns {Date} 东八区时间
 */
const getBeijingTime = (date) => {
  const targetDate = date ? new Date(date) : new Date();
  // 获取UTC时间戳
  const utc = targetDate.getTime() + (targetDate.getTimezoneOffset() * 60000);
  // 东八区时间 = UTC时间 + 8小时
  return new Date(utc + (8 * 3600000));
};

/**
 * 从数据库获取最新的赚钱效应分析数据
 * @returns {Promise<Object|null>} 返回最新的赚钱效应分析数据
 */
const getMarketEffect = async () => {
  try {
    // 从数据库获取最新的赚钱效应数据，按创建时间降序排列，取第一条
    const latestMarketEffect = await MarketEffect.findOne()
      .sort({ createdAt: -1 })
      .lean(); // 使用lean()提高查询性能

    if (latestMarketEffect) {
      console.log("成功从数据库获取最新赚钱效应分析数据");
      return latestMarketEffect;
    } else {
      console.log("数据库中暂无赚钱效应分析数据");
      return null;
    }
  } catch (error) {
    console.error("从数据库获取赚钱效应分析数据失败:", error.message);
    return null;
  }
}

/**
 * 获取赚钱效应分析数据并存入数据库（用于定时任务）
 * @returns {Promise<Array>} 返回赚钱效应分析数据
 */
const fetchAndSaveMarketEffect = async () => {
  try {
    const response = await axios.get(`${AKShareServiceURL}/stock_market_activity_legu`);
    const data = response.data;

    if (data && data.length > 0) {
      // 将数据转换为符合Schema的格式
      const marketEffectData = {};

      // 遍历API返回的数据，根据item字段映射到Schema中的字段
      data.forEach(item => {
        switch (item.item) {
          case "上涨":
            marketEffectData.rise = item.value;
            break;
          case "涨停":
            marketEffectData.limitUp = item.value;
            break;
          case "真实涨停":
            marketEffectData.realLimitUp = item.value;
            break;
          case "st st*涨停":
            marketEffectData.stLimitUp = item.value;
            break;
          case "下跌":
            marketEffectData.fall = item.value;
            break;
          case "跌停":
            marketEffectData.limitDown = item.value;
            break;
          case "真实跌停":
            marketEffectData.realLimitDown = item.value;
            break;
          case "st st*跌停":
            marketEffectData.stLimitDown = item.value;
            break;
          case "平盘":
            marketEffectData.flat = item.value;
            break;
          case "停牌":
            marketEffectData.suspended = item.value;
            break;
          case "活跃度":
            marketEffectData.activity = item.value;
            break;
          case "统计日期":
            // 将统计日期转换为东八区时间
            marketEffectData.statisticsDate = item.value;
            break;
        }
      });

      // 检查是否所有必需字段都已赋值
      const requiredFields = ['rise', 'limitUp', 'realLimitUp', 'stLimitUp', 'fall', 'limitDown', 'realLimitDown', 'stLimitDown', 'flat', 'suspended', 'activity', 'statisticsDate'];
      const missingFields = requiredFields.filter(field => marketEffectData[field] === undefined);

      if (missingFields.length === 0) {
        // 创建新的MarketEffect文档并保存到数据库
        const marketEffect = new MarketEffect(marketEffectData);
        await marketEffect.save();
        console.log("赚钱效应分析数据已成功存入数据库");
      } else {
        console.error("赚钱效应分析数据缺少必需字段:", missingFields);
      }
    }

    return data;
  } catch (error) {
    console.error("获取赚钱效应分析数据失败:", error.message);
    return [];
  }
}

const { getTradeStatus, updateTradeStatus } = require("../../../store/state");
setInterval(async () => {
  const state = getTradeStatus();
  if (state === 1) {
    await fetchAndSaveMarketEffect();
  }
}, 1000 * 60 * 3); // 每3分钟获取一次

module.exports = {
  getMarketEffect,
  fetchAndSaveMarketEffect,
  getBeijingTime
}
