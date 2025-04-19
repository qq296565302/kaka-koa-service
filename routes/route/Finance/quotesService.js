/**
 * 行情数据
 */
const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const wsManager = require("../../../utils/websocketManager");

// 指数行情
const getIndexQuotes = async () => {
    try {
        const response = await axios.get(`${AKShareServiceURL}/stock_zh_index_spot_em?symbol=沪深重要指数`);
        return response.data; // 只返回响应数据，而不是整个响应对象
    } catch (error) {
        console.error("获取指数行情数据失败:", error.message);
        return [];
    }
};

const broadcastIndexQuotes = async () => {
    const indexQuotes = await getIndexQuotes();
    wsManager.broadcast({
        type: 'indexQuotes',
        data: indexQuotes
    });
};

let quotesType = {
    shanghaiStockQuotes: 'stock_sh_a_spot_em'
};
// 沪A股实时行情（所有个股）
let shanghaiStockQuotes = [];
const getShanghaiStockQuotes = async () => {
    try {
        const response = await axios.get(`${AKShareServiceURL}/${quotesType.shanghaiStockQuotes}`);
        return response;
    } catch (error) {
        console.error("获取A股实时行情数据失败:", error.message);
        return [];
    }
};



// 交易状态
let tradeStatus = '0';
// 定义处理客户端消息的函数
const handleClientMessage = (message) => {
    let msg;
    try {
        msg = JSON.parse(message);
    } catch (e) {
        msg = message; // 非JSON，直接使用原内容
    }
    if (msg && msg.type) {
        console.log('消息类型:', msg.type);

        // 根据消息类型处理不同请求
        if (msg.type === 'tradeStatusChange') {
            tradeStatus = msg.data.status;
            if (tradeStatus === '1') {
                broadcastIndexQuotes();
            }
        }
    }
    return null;
};
module.exports = {
    shanghaiStockQuotes,
    getShanghaiStockQuotes,
    handleClientMessage,
    getIndexQuotes
};

// 每10秒钟自动获取一次实时行情数据
setInterval(async () => {
    if (tradeStatus === '1') {
        broadcastIndexQuotes();
    }
}, 10000);