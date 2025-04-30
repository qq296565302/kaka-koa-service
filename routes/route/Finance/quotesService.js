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
const publicQuotes = ['000001', '399001', '399006', '000688'];
const getPublicQuotes = async () => {
    try {
        const responses = await Promise.all(publicQuotes.map(symbol => {
            // 股票代码前加'SH'或'SZ'
            const prefix = symbol.startsWith('3') ? 'SZ' : 'SH';
            const url = `${AKShareServiceURL}/stock_individual_spot_xq?symbol=${prefix}${symbol}`;
            return axios.get(url, { timeout: 10000 });
        }));
        return responses.map(response => response.data);
    } catch (error) {
        console.error("获取公共行情数据失败:", error.message);
        return [];
    }
};

const broadcastPublicQuotes = async () => {
    const publicQuotesData = await getPublicQuotes();
    wsManager.broadcast({
        type: 'public_quotes_update',
        data: publicQuotesData
    });
};

/**
 * 东财 日内分时买卖盘数据
 */

const getDcOrderData = async () => {
    try {
        const responses = await Promise.all(publicQuotes.map(symbol => {
            const url = `${AKShareServiceURL}/stock_intraday_em?symbol=${symbol}`;
            return { symbol, response: axios.get(url, { timeout: 10000 }) };
        }));
        
        const results = await Promise.all(responses.map(async ({ symbol, response }) => {
            try {
                const data = (await response).data;
                
                // 1. 拍平二维数组
                const flattenedData = [].concat(...data);
                
                // 2. 过滤掉"买卖盘性质"为"中性盘"的数据或者时间早于9点30分钟的数据
                const filteredData = flattenedData.filter(item => {
                    // 过滤中性盘
                    if (item["买卖盘性质"] === "中性盘") {
                        return false;
                    }
                    
                    // 过滤时间早于9点30分钟的数据
                    const timeStr = item["时间"];
                    if (timeStr) {
                        // 假设时间格式为 "HH:MM"
                        const [hours, minutes] = timeStr.split(":").map(Number);
                        
                        // 早于9:30的数据不要
                        if (hours < 9 || (hours === 9 && minutes < 30)) {
                            return false;
                        }
                    }
                    
                    return true;
                });
                
                // 3. 合并同一分钟内买卖盘性质相同的数据
                const dataMap = new Map();
                
                // 添加前缀
                const prefix = symbol.startsWith('3') ? 'SZ' : 'SH';
                const fullSymbol = `${prefix}${symbol}`;
                
                filteredData.forEach(item => {
                    // 从时间字符串中提取小时和分钟，忽略秒
                    const timeStr = item["时间"];
                    let hourMinute = timeStr;
                    
                    // 如果时间包含秒，则只保留小时和分钟
                    if (timeStr && timeStr.split(":").length > 2) {
                        const timeParts = timeStr.split(":");
                        hourMinute = `${timeParts[0]}:${timeParts[1]}`;
                    }
                    
                    // 使用小时分钟和买卖盘性质作为唯一键
                    const key = `${hourMinute}_${item["买卖盘性质"]}`;
                    
                    if (dataMap.has(key)) {
                        // 如果已存在相同小时分钟和性质的数据，则合并数量
                        const existingItem = dataMap.get(key);
                        existingItem["手数"] = (parseFloat(existingItem["手数"]) + parseFloat(item["手数"])).toString();
                        
                    } else {
                        // 如果不存在，则添加到Map中，并使用小时分钟格式的时间
                        const newItem = {...item};
                        newItem["时间"] = hourMinute; // 替换为小时分钟格式
                        dataMap.set(key, newItem);
                    }
                });
                
                // 将Map转换回数组
                return {
                    symbol: fullSymbol,
                    data: Array.from(dataMap.values())
                };
            } catch (error) {
                console.error(`处理股票${symbol}数据失败:`, error.message);
                return [];
            }
        }));
        
        // 返回所有股票的处理结果
        return results;
    } catch (error) {
        console.error("获取东财日內分时买卖盘数据失败:", error.message);
        return [];
    }
};

const broadcastDcOrderData = async () => {
    const dcOrderData = await getDcOrderData();
    wsManager.broadcast({
        type: 'dc_order_data_update',
        data: dcOrderData
    });
};

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
    getDcOrderData,
    handleClientMessage
};

// 每5秒钟自动获取一次实时行情数据

let quotesTimer = setInterval(async () => {
    if (tradeStatus === '1') {
        broadcastDcOrderData(); // 广播东财日內分时买卖盘数据
        broadcastPublicQuotes(); // 广播公共行情数据
    }
}, 5000);

process.on("exit", () => {
    clearInterval(quotesTimer);
});