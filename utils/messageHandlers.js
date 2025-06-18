/**
 * 消息处理器集合
 * 实现所有消息类型的处理逻辑
 */
const eventBus = require("./eventBus");
const logger = require("./logger");


/**
 * 注册所有消息处理器
 */
const registerAllHandlers = () => {
  // 注册交易状态变更处理器
  eventBus.subscribe("getStatus", handleTradeStatus);

  // 注册交易日历更新处理器
  eventBus.subscribe("tradeCalendarUpdate", handleTradeCalendarUpdate);

  // 注册股票信息更新处理器
  eventBus.subscribe("stockInfoUpdate", handleStockInfoUpdate);
};

/**
 * 处理客户端请求获取交易状态消息
 * @param {Object} data - 消息数据
 */
const handleTradeStatus = async (data) => {
  logger.info("收到交易状态事件:", data);
  const wsManager = require("./websocketManager");
  const { tradeTimeService } = require("../routes/route/TradeCalendar/tradeTimeService");
  
  switch (data.type) {
    case "tradeStatus":
      try {
        // 获取当前交易状态
        const currentTimestamp = new Date().getTime();
        const tradeStatus = await tradeTimeService(currentTimestamp);
        
        // 构建状态消息
        const statusMessage = {
          type: "tradeStatus",
          status: tradeStatus,
          statusText: getStatusText(tradeStatus),
          timestamp: currentTimestamp,
          datetime: new Date().toLocaleString('zh-CN')
        };
        
        // 通过WebSocket发送消息给所有客户端
        wsManager.broadcast(statusMessage);
        
        logger.info(`交易状态已发送: ${statusMessage.statusText} (${tradeStatus})`);
      } catch (error) {
        logger.error("获取交易状态失败:", error);
        
        // 发送错误消息
        const errorMessage = {
          type: "tradeStatus",
          error: "获取交易状态失败",
          timestamp: new Date().getTime()
        };
        
        wsManager.broadcast(errorMessage);
      }
      break;
    default:
      return null;
  }
};

/**
 * 获取交易状态的文本描述
 * @param {number} status - 交易状态码
 * @returns {string} 状态文本描述
 */
const getStatusText = (status) => {
  const statusMap = {
    0: "休市",
    1: "正在交易",
    2: "已收盘",
    3: "未开盘",
    4: "午间休市"
  };
  
  return statusMap[status] || "未知状态";
}

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
  const { getStockInfo, saveStockInfo } = require("../routes/route/Finance/stockInfoService");
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
  handleTradeStatus,
  handleTradeCalendarUpdate,
  handleStockInfoUpdate
};
