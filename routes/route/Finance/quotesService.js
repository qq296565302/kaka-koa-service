const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const CommonQuotes = require("../../../models/CommonQuotes");

/**
 * * 验证和处理单条行情数据
 * * @param {Object} item 原始数据项
 * * @returns {Object} 处理后的数据项
 */
const validateAndProcessQuoteItem = (item) => {
  // 定义必需字段及其默认值
  const requiredFields = {
    '代码': '',
    '名称': '',
    '最新价': 0,
    '涨跌幅': 0,
    '涨跌额': 0,
    '成交量': 0,
    '成交额': 0,
    '振幅': 0,
    '最高': 0,
    '最低': 0,
    '今开': 0,
    '昨收': 0,
    '量比': 0
  };

  const processedItem = {};
  // 处理每个必需字段
  for (const [field, defaultValue] of Object.entries(requiredFields)) {
    if (item.hasOwnProperty(field) && item[field] !== null && item[field] !== undefined) {
      // 如果是数字字段，确保转换为数字类型
      if (typeof defaultValue === 'number') {
        const numValue = parseFloat(item[field]);
        processedItem[field] = isNaN(numValue) ? defaultValue : numValue;
      } else {
        processedItem[field] = item[field];
      }
    } else {
      // 使用默认值
      processedItem[field] = defaultValue;
    }
  }

  return processedItem;
};

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
    const rawQuotesData = response.data;

    if (rawQuotesData && rawQuotesData.length > 0) {
      // 验证和处理数据
      const processedQuotesData = rawQuotesData.map(item => validateAndProcessQuoteItem(item));

      // 过滤掉无效数据（代码或名称为空的数据）
      const validQuotesData = processedQuotesData.filter(item =>
        item['代码'] && item['代码'].trim() !== '' &&
        item['名称'] && item['名称'].trim() !== ''
      );

      if (validQuotesData.length > 0) {
        // 清空原有数据
        await CommonQuotes.deleteMany({});

        // 插入新数据
        await CommonQuotes.insertMany(validQuotesData);
        console.log(`成功保存 ${validQuotesData.length} 条公共行情数据到数据库`);

        if (validQuotesData.length < rawQuotesData.length) {
          console.warn(`过滤掉 ${rawQuotesData.length - validQuotesData.length} 条无效数据`);
        }
      } else {
        console.warn('没有有效的行情数据可以保存');
      }

      return validQuotesData;
    } else {
      console.warn('API返回的数据为空');
      return [];
    }
  } catch (error) {
    console.error("获取或保存公共行情数据失败:", error.message);
    if (error.response) {
      console.error("API响应状态:", error.response.status);
      console.error("API响应数据:", error.response.data);
    }
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
}, 1000 * 60 * 0.5); // 每0.5分钟获取一次

module.exports = {
  saveCommonQuotes,
  getCommonQuotes,
  validateAndProcessQuoteItem
};
