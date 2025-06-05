const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const TradeCalendar = require("../../../models/TradeCalendar");
const StockInfo = require("../../../models/StockInfo");

/**
 * * 交易日历
 * @Function isTradeCalendarStale 判断交易日历是否需要更新
 * @Function saveTradeCalendar 将交易日历存入数据库
 * @Function getTradeCalendar 获取交易日历数据
 */

const getTradeCalendar = async () => {
  const Year = new Date().getFullYear();
  const nextYear = new Date().getFullYear() + 1;
  let tradeCalendar = [];
  try {
    const response = await axios.get(
      `${AKShareServiceURL}/tool_trade_date_hist_sina`
    );
    tradeCalendar.push(
      ...response.data.filter((item) => {
        item.trade_date = item.trade_date.split("T")[0];
        return (
          item.trade_date.includes(Year) || item.trade_date.includes(nextYear)
        );
      })
    );
    saveTradeCalendar(tradeCalendar);
    return tradeCalendar;
  } catch (error) {
    console.error("获取交易日历数据失败:", error.message);
    return [];
  }
};

// 判断交易日历是否需要更新
const isTradeCalendarStale = async () => {
  const lastRecord = await TradeCalendar.findOne().sort({ _id: -1 });
  if (lastRecord) {
    const lastDate = new Date(lastRecord.trade_date);
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    return lastDate < thirtyDaysLater;
  }
  return true;
};

// 将交易日历存入数据库
const saveTradeCalendar = async (tradeCalendar) => {
  try {
    try {
      // 先清空现有数据，避免重复
      const deleteResult = await TradeCalendar.deleteMany({});
      console.log(`已删除 ${deleteResult.deletedCount} 条交易日历数据`);

      // 使用bulkWrite批量插入，并处理可能的重复数据
      if (tradeCalendar && tradeCalendar.length > 0) {
        // 将数据转换为upsert操作
        const bulkOps = tradeCalendar.map(item => ({
          updateOne: {
            filter: { trade_date: item.trade_date },
            update: { $set: item },
            upsert: true
          }
        }));

        const bulkResult = await TradeCalendar.bulkWrite(bulkOps);
        console.log(`交易日历数据已成功存入数据库，插入: ${bulkResult.insertedCount}, 更新: ${bulkResult.modifiedCount}, 匹配: ${bulkResult.matchedCount}`);
      } else {
        console.log("没有交易日历数据需要保存");
      }
    } catch (dbError) {
      console.error("数据库操作失败:", dbError.message);
      throw dbError; // 将错误向上抛出，以便外部catch捕获
    }
  } catch (error) {
    console.error("存入交易日历数据失败:", error.message);
  }
};

const {
  getStockInfo,
  isStockInfoStale,
  saveStockInfo,
  getAllStockInfo,
  getStockInfoBasic
} = require('./stockInfoService');

/**
 * 获取服务器时间（北京时间）
 * @returns {string} - 北京时间字符串
 */
const getServerTime = () => {
  const date = new Date();
  // 转换为北京时间 (UTC+8)
  return new Date(date.getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .replace("Z", "+08:00");
};


module.exports = {
  getTradeCalendar,
  saveTradeCalendar,
  isTradeCalendarStale,
  getServerTime,
  getStockInfo,
  isStockInfoStale,
  saveStockInfo,
  getAllStockInfo,
  getStockInfoBasic
};
