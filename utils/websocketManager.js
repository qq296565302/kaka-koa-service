/**
 * WebSocket 连接管理器
 * 用于存储和管理所有活跃的 WebSocket 连接
 */
const logger = require('./logger');

// 存储所有活跃的 WebSocket 连接
const connections = new Set();

/**
 * 添加新的 WebSocket 连接
 * @param {WebSocket} ws - WebSocket 连接实例
 */
const addConnection = (ws) => {
  connections.add(ws);
  logger.info(`WebSocket 连接已添加，当前连接数: ${connections.size}`);
};

/**
 * 移除 WebSocket 连接
 * @param {WebSocket} ws - WebSocket 连接实例
 */
const removeConnection = (ws) => {
  connections.delete(ws);
  logger.info(`WebSocket 连接已移除，当前连接数: ${connections.size}`);
};

/**
 * 向所有活跃的 WebSocket 连接广播消息
 * @param {Object} data - 要广播的数据对象
 */
const broadcast = (data) => {
  const message = typeof data === 'string' ? data : JSON.stringify(data);
  let successCount = 0;
  connections.forEach((ws) => {
    try {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(message);
        successCount++;
      }
    } catch (error) {
      logger.error('发送 WebSocket 消息失败:', error);
    }
  });
  
  logger.info(`WebSocket 广播消息成功发送到 ${successCount}/${connections.size} 个连接`);
};

/**
 * 获取当前连接数
 * @returns {number} 当前活跃连接数
 */
const getConnectionsCount = () => connections.size;

module.exports = {
  addConnection,
  removeConnection,
  broadcast,
  getConnectionsCount
};
