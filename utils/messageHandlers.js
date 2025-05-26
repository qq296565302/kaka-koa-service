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

module.exports = {
  registerAllHandlers,
  handleTradeStatusChange,
};
