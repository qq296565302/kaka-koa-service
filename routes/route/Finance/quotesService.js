/**
 * 行情数据
 */
const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const wsManager = require("../../../utils/websocketManager");
const { saveState, loadState } = require("../../../utils/stateStorage");

// 指数行情
const getIndexQuotes = async (symbol="沪深重要指数") => {
    try {
        const response = await axios.get(`${AKShareServiceURL}/stock_zh_index_spot_em?symbol=${symbol}`);
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



// 交易状态 - 从存储中加载初始状态，如果没有则默认为'0'
let tradeStatus = '0';

// 尝试从存储加载交易状态
try {
    const savedState = loadState();
    if (savedState && savedState.tradeStatus) {
        tradeStatus = savedState.tradeStatus;
        console.log('已从存储加载交易状态:', tradeStatus);
    }
} catch (error) {
    console.error('加载交易状态失败:', error);
}

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
            // 保存交易状态到文件
            saveState({ tradeStatus });
            console.log('交易状态已更新并保存:', tradeStatus);
            
            if (tradeStatus === '1') {
                broadcastIndexQuotes();
            }
        }
    }
    return null;
};
module.exports = {
    tradeStatus,
    shanghaiStockQuotes,
    getShanghaiStockQuotes,
    handleClientMessage,
    getIndexQuotes
};

// 每5秒钟自动获取一次实时行情数据

let quotesTimer = setInterval(async () => {
    if (tradeStatus === '1') {
        broadcastIndexQuotes();
    }
}, 5000);

process.on('exit', () => {
    clearInterval(quotesTimer);
});