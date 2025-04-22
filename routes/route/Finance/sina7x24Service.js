/**
 * 新浪7x24服务
 * 负责获取、处理和缓存新浪财经数据
 */
const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const wsManager = require("../../../utils/websocketManager");


// 新闻数据缓存
const sina7x24Data = {
    data: [],
    updatedCount: 0,
    lastFetchTime: null,
};
// 定时获取数据的间隔时间（2分钟）
const FETCH_INTERVAL = 2 * 60 * 1000;
// 定时器引用
let sina7x24Timer = null;

/**
 * 获取新浪财经数据
 * @returns {Promise<Array>} - 新浪财经数据
 */
const getSina7x24 = async () => {
    try {
        const response = await axios.get(`${AKShareServiceURL}/stock_info_global_sina`);
        if(!response.data || !Array.isArray(response.data)) {
            console.error("获取新浪财经数据格式错误:", response.data);
            return [];
        }
        console.log('获取新浪财经数据成功',response.data);
        return response.data; // 只返回响应数据，而不是整个响应对象
    } catch (error) {
        console.error("获取新浪财经数据失败:", error.message);
        return [];
    }
};

/**
 * 获取当前缓存的新浪财经数据
 */
const getSina7x24Data = () => {
    return {
        data: sina7x24Data.data,
        count: sina7x24Data.updatedCount,
        lastUpdate: sina7x24Data.lastFetchTime,
    };
};

module.exports = {
    getSina7x24,
    getSina7x24Data,
};