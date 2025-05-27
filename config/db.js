// MongoDB数据库配置
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// MongoDB连接配置
const MONGO_URL = 'mongodb://localhost:27017/KaKaIA';

// 连接到MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    logger.info('MongoDB连接成功');
    return true;
  } catch (error) {
    logger.error('MongoDB连接失败:', error);
    return false;
  }
};

// 监听MongoDB连接事件
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB连接断开，尝试重新连接...');
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB连接错误:', err);
});

/**
 * 检查数据库连接状态
 * @returns {Boolean} 连接状态
 */
const checkConnection = () => {
  return mongoose.connection.readyState === 1; // 1表示已连接
};

module.exports = {
  connectDB,
  mongoose,
  checkConnection
};
