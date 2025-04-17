const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
/**
 * 交易日历
 * 获取交易日历数据
 */

const getTradeCalendar = async () => {
    const Year = new Date().getFullYear();
    const nextYear = new Date().getFullYear() + 1;
    const tradeCalendar = [];
    try {
        const response = await axios.get(`${AKShareServiceURL}/tool_trade_date_hist_sina`);
        tradeCalendar.push(
            ...response.data.filter((item) => {
                return item.trade_date.includes(Year) || item.trade_date.includes(nextYear);
            })
        );
        return tradeCalendar;
    } catch (error) {
        console.error("获取交易日历数据失败:", error.message);
        return [];
    }
};
/**
 * 获取服务器时间（北京时间）
 * @returns {string} - 北京时间字符串
 */
const getServerTime = () => {
    const date = new Date();
    // 转换为北京时间 (UTC+8)
    return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().replace('Z', '+08:00');
};

module.exports = {
    getTradeCalendar,
    getServerTime,
};
