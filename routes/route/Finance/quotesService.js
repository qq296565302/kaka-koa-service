/**
 * 行情数据
 */
const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const wsManager = require("../../../utils/websocketManager");
const { saveState, loadState } = require("../../../utils/stateStorage");


/**
 * 获取公共行情（上证指数、深证指数、创业板指数、科创50）
 * 上证指数 SH000001
 * 深证指数 SZ399001
 * 创业板指数 SZ399006
 * 科创50 SH000688
 */
let publicQuotesData = [];
const getPublicQuotes = async () => {
    const publicQuotes = ['SH000001', 'SZ399001', 'SZ399006', 'SH000688'];
    try {
        const responses = await Promise.all(publicQuotes.map(symbol => {
            const url = `${AKShareServiceURL}/stock_individual_spot_xq?symbol=${symbol}`;
            return axios.get(url, { timeout: 10000 });
        }));
        return responses.map(response => response.data);
    } catch (error) {
        console.error("获取公共行情数据失败:", error.message);
        return [];
    }
};
getPublicQuotes().then(data => publicQuotesData.push(...data));

const broadcastPublicQuotes = async () => {
    publicQuotesData = await getPublicQuotes();
    wsManager.broadcast({
        type: 'public_quotes_update',
        data: publicQuotesData
    });
};

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
    getPublicQuotes,
    handleClientMessage
};

// 每5秒钟自动获取一次实时行情数据

let quotesTimer = setInterval(async () => {
    if (tradeStatus === '1') {
        broadcastPublicQuotes();
    }
}, 5000);

process.on("exit", () => {
    clearInterval(quotesTimer);
});