const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const CommonQuotes = require("../../../models/CommonQuotes");

/**
 * * 保存和获取公共指数数据
 * * @param {*} symbol choice of {"沪深重要指数", "上证系列指数", "深证系列指数", "指数成份", "中证系列指数"} 
 * * 数据结构：
 * * {
 * * "代码": "000001",
 * * "名称": "上证指数",
 * * "最新价": 3412.44,
 * * "涨跌幅": 0.91,
 * * "涨跌额": 30.86,
 * * "成交量": 155713423,
 * * "成交额": 181636713854.2,
 * * "振幅": 1.02,
 * * "最高": 3414.74,
 * * "最低": 3380.08,
 * * "今开": 3380.08,
 * * "昨收": 3381.58,
 * * "量比": 2.71,
 * * }
 * @returns {*} 公共指数数据
 */
const saveCommonQuotes = async () => {
  try {
    const url = `${AKShareServiceURL}/stock_zh_index_spot_em?symbol=沪深重要指数`;
    const response = await axios.get(url, { timeout: 10000 });
    const quotesData = response.data;
    
    if (quotesData && quotesData.length > 0) {
      // 清空原有数据
      await CommonQuotes.deleteMany({});
      
      // 插入新数据
      await CommonQuotes.insertMany(quotesData);
      console.log(`成功保存 ${quotesData.length} 条公共行情数据到数据库`);
    }
    
    return quotesData;
  } catch (error) {
    console.error("获取或保存公共行情数据失败:", error.message);
    return [];
  }
};

const getCommonQuotes = async () => {
  try {
    const quotes = await CommonQuotes.find({}).sort({ updatedAt: -1 });
    return quotes;
  } catch (error) {
    console.error("从数据库获取公共行情数据失败:", error.message);
    return [];
  }
};

/**
 * * 定时获取和保存公共指数数据
 * * 每1分钟获取一次
 */
const { getTradeStatus } = require("../../../store/state");
setInterval(async () => {
  const state = getTradeStatus();
  if (state === 1) {
    await saveCommonQuotes();
  }
}, 1000 * 60 * 0.5); // 每1分钟获取一次

module.exports = {
  saveCommonQuotes,
  getCommonQuotes
};
