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
 * 获取赚钱效应分析数据并存入数据库
 * @returns {Promise<Array>} 返回赚钱效应分析数据
 */
const getMarketEffect = async () => {
  try {
    const response = await axios.get(`${AKShareServiceURL}/stock_market_activity_legu`);
    const data = response.data;
    
    if (data && data.length > 0) {
      // 将数据转换为符合Schema的格式
      const marketEffectData = {};
      
      // 遍历API返回的数据，根据item字段映射到Schema中的字段
      data.forEach(item => {
        switch(item.item) {
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
            marketEffectData.statisticsDate = new Date(item.value);
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

module.exports = {
  getMarketEffect
}
