/**
 * 消息处理器集合
 * 实现所有消息类型的处理逻辑
 */
const eventBus = require("./eventBus");
const logger = require("./logger");
const { saveState } = require("./stateStorage");

/**
 * 注册所有消息处理器
 */
const registerAllHandlers = () => {
  // 注册交易状态变更处理器
  eventBus.subscribe("tradeStatusChange", handleTradeStatusChange);
  
  // 注册交易日历更新处理器
  eventBus.subscribe("tradeCalendarUpdate", handleTradeCalendarUpdate);

  // 注册股票信息更新处理器
  eventBus.subscribe("stockInfoUpdate", handleStockInfoUpdate);
};

/**
 * 处理交易状态变更消息
 * @param {Object} data - 消息数据
 */
const handleTradeStatusChange = (data) => {
  const quotesService = require("../routes/route/Finance/quotesService");

  quotesService.tradeStatus = data.status;
  // 保存交易状态到文件
  saveState({ tradeStatus: quotesService.tradeStatus });
  logger.info("交易状态已更新并保存:", quotesService.tradeStatus);

  if (quotesService.tradeStatus === "1") {
    // 交易状态变为开启时的操作
    quotesService.broadcastPublicQuotes &&
      quotesService.broadcastPublicQuotes();
  }
};

/**
 * 处理交易日历更新消息
 * @param {Object} data - 消息数据
 */
const handleTradeCalendarUpdate = async (data) => {
  const { getTradeCalendar, saveTradeCalendar } = require("../routes/route/Finance/common");
  logger.info("收到交易日历更新事件:", data);
  
  // 获取并保存最新的交易日历数据
  try {
    await getTradeCalendar();
    try {
      await saveTradeCalendar();
      logger.info("交易日历数据已成功更新");
    } catch (err) {
      logger.error("保存交易日历数据失败:", err);
    }
  } catch (err) {
    logger.error("获取交易日历数据失败:", err);
  }
};



/**
 * 处理股票信息更新消息
 * @param {Object} data - 消息数据
 */
const handleStockInfoUpdate = async (data) => {
  const { getStockInfo, saveStockInfo } = require("../routes/route/Finance/common");
  logger.info("收到股票信息更新事件:", data);
  
  // 获取并保存最新的股票信息数据
  try {
    await getStockInfo();
    try {
      await saveStockInfo();
      logger.info("股票信息数据已成功更新");
    } catch (err) {
      logger.error("保存股票信息数据失败:", err);
    }
  } catch (err) {
    logger.error("获取股票信息数据失败:", err);
  }
};

module.exports = {
  registerAllHandlers,
  handleTradeStatusChange,
  handleTradeCalendarUpdate,
  handleStockInfoUpdate
};
