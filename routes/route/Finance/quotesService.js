/**
 * 行情数据
 */
const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const wsManager = require("../../../utils/websocketManager");

// A股实时行情（所有个股）
let quotesData = [];
const getAStockQuotes = async () => {
    try {
        const response = await axios.get(`${AKShareServiceURL}/stock_zh_a_spot_em`);
        quotesData = response;
        return response;
    } catch (error) {
        console.error("获取A股实时行情数据失败:", error.message);
        return [];
    }
};
// 定义处理客户端消息的函数
const handleClientMessage = (message) => {
    let msg;
    try {
        msg = JSON.parse(message);
    } catch (e) {
        msg = message; // 非JSON，直接使用原内容
    }
    console.log('收到消息:', msg);
    if (msg && msg.type) {
        console.log('消息类型:', msg.type);
        
        // 根据消息类型处理不同请求
        if (msg.type === 'getQuotes') {
            // 向请求客户端发送最新行情数据
            return quotesData;
        }
    }
    return null;
};
module.exports = {
    quotesData,
    getAStockQuotes,
    handleClientMessage
};

// 每10秒钟自动获取一次A股实时行情数据
// setInterval(() => {
//     getAStockQuotes();
// }, 10000);