/**
 * 消息处理器
 * 负责接收和分发所有类型的WebSocket消息
 */
const eventBus = require("./eventBus");
const logger = require("./logger");

/**
 * 处理客户端消息
 * @param {string|object} message - 客户端发送的消息
 * @returns {object|null} - 响应消息或null
 */
const handleClientMessage = (message) => {
  let msg;
  try {
    // 智能消息解析：自动判断是否是JSON字符串
    msg = typeof message === "string" ? JSON.parse(message) : message;
    // 就像快递员拆包裹，如果是密封的（字符串）就拆开，否则直接处理
  } catch (e) {
    // 解析失败时降级处理，保留原始消息
    msg = message;
    // 好比包裹拆坏了，至少把破损包裹交给收件人
  }
  if (msg && msg.type) {
    logger.info("收到消息类型:", msg.type);
    // 记录日志就像快递站的扫码枪，记录每个包裹信息
    // 交给专业的分拣系统处理
    return processMessage(msg);
  }
  return null;
  // 如果是无效消息就直接丢弃，像处理垃圾邮件一样
};

/**
 * 处理并分发消息
 * @param {object} msg - 消息对象
 * @returns {object|null} - 响应消息或null
 */
const processMessage = (msg) => {
  if (msg && msg.type) {
    // 这里是精华所在！通过事件总线发布消息
    eventBus.publish(msg.type, msg.data);
    // 就像把包裹放到传送带上，自动送到对应部门
    // 贴心的监控机制：记录未知消息类型
    if (
      !eventBus.subscribers[msg.type] ||
      eventBus.subscribers[msg.type].length === 0
    ) {
      logger.warn("未知的消息类型:", msg.type);
      // 就像快递站发现没有对应收件人时发出警报
    }
  }
  return null;
  // 不直接返回处理结果，因为采用发布订阅模式
};

module.exports = {
  handleClientMessage,
  processMessage,
};
