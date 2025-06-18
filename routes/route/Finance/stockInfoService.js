const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const StockInfo = require("../../../models/StockInfo");

/**
 * * 股票基本信息 5000+条
 * TODO 未考虑退市股票，更新的时候需要删除已退市股票
 * @Function getStockInfo 获取A股市场所有股票信息，包含重试机制，最多重试三次
 * @Function isStockInfoStale 判断股票信息是否需要更新
 * @Function saveStockInfo 保存股票信息到数据库，包含缓存机制和分批处理
 */

const getStockInfo = async () => {
  // 使用模拟数据进行测试
  const useMockData = false; // 如果服务器总是失败，设置为true使用模拟数据

  if (useMockData) {
    console.log('使用模拟数据进行测试');
    // 返回一些模拟数据用于测试
    return [
      {
        symbol: '000001',
        name: '平安银行',
        latestPrice: 10.25,
        changePercent: 1.5,
        changeAmount: 0.15,
        volume: 100000,
        turnover: 1025000,
        amplitude: 2.5,
        highPrice: 10.35,
        lowPrice: 10.10,
        openPrice: 10.15,
        prevClosePrice: 10.10,
        volumeRatio: 1.2,
        turnoverRate: 0.5,
        peDynamic: 8.5,
        pbRatio: 0.9,
        totalMarketValue: 2000000000,
        circulationMarketValue: 1500000000,
        changeSpeed: 0.2,
        fiveMinuteChange: 0.3,
        sixtyDayChange: 5.2,
        ytdChange: 8.7,
        updateTime: new Date()
      },
      // 可以添加更多模拟数据...
    ];
  }

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const requestId = Date.now(); // 生成唯一请求ID
      console.log(`[请求ID: ${requestId}] 开始请求A股市场数据: ${AKShareServiceURL}/stock_zh_a_spot_em (尝试 ${retryCount + 1}/${maxRetries})`);

      // 设置更长的超时时间和更大的响应数据限制
      const response = await axios.get(
        `${AKShareServiceURL}/stock_zh_a_spot_em`,
        {
          timeout: 180000, // 3分钟超时
          maxContentLength: 20 * 1024 * 1024, // 20MB
          maxBodyLength: 20 * 1024 * 1024, // 20MB
          headers: {
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
          }
        }
      );

      console.log(`[请求ID: ${requestId}] 请求成功，状态码: ${response.status}`);

      // 检查响应数据结构
      if (!response.data || !Array.isArray(response.data)) {
        console.error(`[请求ID: ${requestId}] 返回数据格式不正确，应为数组格式`, typeof response.data);
        retryCount++;
        continue;
      }

      console.log(`[请求ID: ${requestId}] 获取到原始数据 ${response.data.length} 条`);

      // 将返回的数据字段名从中文转换为英文
      const transformedData = response.data.map(item => {
        // 检查必要字段是否存在
        if (!item["代码"] || !item["名称"]) {
          return null;
        }

        return {
          symbol: item["代码"],
          name: item["名称"],
          totalMarketValue: parseFloat(item["总市值"]) || 0,
          circulationMarketValue: parseFloat(item["流通市值"]) || 0,
          ytdChange: parseFloat(item["年初至今涨跌幅"]) || 0,
          updateTime: new Date()
        };
      }).filter(item => item !== null); // 过滤掉无效数据

      console.log(`[请求ID: ${requestId}] 数据转换后共 ${transformedData.length} 条有效记录`);

      return transformedData;
    } catch (error) {
      retryCount++;
      console.error(`获取A股市场所有股票信息失败 (尝试 ${retryCount}/${maxRetries}):`, error.message);

      if (retryCount < maxRetries) {
        const waitTime = 3000 * retryCount; // 每次重试等待时间增加
        console.log(`将在 ${waitTime / 1000} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error('已达到最大重试次数，放弃获取股票数据');
        return [];
      }
    }
  }

  return [];
};

// TODO 需要完善是否更新的判断机制
const isStockInfoStale = async () => {
  const lastRecord = await StockInfo.findOne().sort({ _id: -1 });
  if (lastRecord) {
    return false;
  }
  return true;
};

// 缓存股票数据，避免频繁请求API
let stockInfoCache = null;
let stockInfoCacheTime = null;
const CACHE_VALID_TIME = 30 * 60 * 1000; // 30分钟缓存有效期

const saveStockInfo = async () => {
  try {
    // 尝试使用缓存数据
    let stockInfo;
    const now = Date.now();

    if (stockInfoCache && stockInfoCacheTime && (now - stockInfoCacheTime < CACHE_VALID_TIME)) {
      console.log(`使用缓存的股票数据，缓存时间: ${new Date(stockInfoCacheTime).toLocaleString()}, 有效期: ${CACHE_VALID_TIME / 60000} 分钟`);
      stockInfo = stockInfoCache;
    } else {
      // 缓存无效，重新获取数据
      stockInfo = await getStockInfo();

      // 更新缓存
      if (stockInfo && stockInfo.length > 0) {
        stockInfoCache = stockInfo;
        stockInfoCacheTime = now;
        console.log(`更新股票数据缓存，时间: ${new Date().toLocaleString()}`);
      }
    }

    console.log(`获取到 ${stockInfo.length} 条股票信息数据`);

    // 如果没有数据，尝试使用数据库中的现有数据
    if (stockInfo.length === 0) {
      const existingCount = await StockInfo.countDocuments();
      if (existingCount > 0) {
        console.log(`无法获取新数据，但数据库中已有 ${existingCount} 条记录，保留现有数据`);
        return;
      }
    }

    // 先清空现有数据，避免重复
    if (stockInfo.length > 0) {
      const deleteResult = await StockInfo.deleteMany({});
      console.log(`已删除 ${deleteResult.deletedCount} 条股票信息数据`);

      // 分批处理数据，避免内存溢出
      const batchSize = 500; // 每批处理500条数据
      let insertedCount = 0;
      let modifiedCount = 0;
      let matchedCount = 0;
      let failedBatches = 0;

      console.log(`开始分批处理数据，总数: ${stockInfo.length}, 批量大小: ${batchSize}`);

      // 分批处理
      for (let i = 0; i < stockInfo.length; i += batchSize) {
        const batch = stockInfo.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(stockInfo.length / batchSize);
        console.log(`处理第 ${batchNumber}/${totalBatches} 批数据，共 ${batch.length} 条`);

        const bulkOps = batch.map(item => ({
          updateOne: {
            filter: { symbol: item.symbol },
            update: { $set: item },
            upsert: true
          }
        }));

        try {
          const bulkResult = await StockInfo.bulkWrite(bulkOps, { ordered: false });

          // 新版MongoDB返回格式
          insertedCount += bulkResult.insertedCount || bulkResult.upsertedCount || 0;
          modifiedCount += bulkResult.modifiedCount || 0;
          matchedCount += bulkResult.matchedCount || 0;

          console.log(`批次 ${batchNumber}/${totalBatches} 处理完成，插入/更新: ${insertedCount + modifiedCount}, 匹配: ${matchedCount}`);
        } catch (batchError) {
          failedBatches++;
          console.error(`批次 ${batchNumber}/${totalBatches} 处理失败:`, batchError.message);
        }

        // 等待一小段时间，避免过快请求导致数据库压力
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (failedBatches > 0) {
        console.warn(`注意: 有 ${failedBatches} 个批次处理失败`);
      }

      console.log(`股票信息数据已成功存入数据库，总计插入: ${insertedCount}, 更新: ${modifiedCount}, 匹配: ${matchedCount}`);
    } else {
      console.log("没有股票信息需要保存");
    }
  } catch (error) {
    console.error("存入股票信息失败:", error.message);
    console.error(error.stack);
  }
};

/**
 * * 完善股票基本信息
 * @Function updateStockInfoVersion 更新所有股票信息的版本号
 * @Function getAllStockInfo 获取所有股票信息并缓存到内存
 */
let allStockInfo = [];// 更新所有股票信息的版本号
const updateStockInfoVersion = async () => {
  try {
    console.log('开始更新所有股票信息的版本号');
    // 批量更新所有没有 version 字段或 version 字段为 null 的记录
    const updateResult = await StockInfo.updateMany(
      { $or: [{ version: { $exists: false } }, { version: null }] },
      { $set: { version: 0 } }
    );
    console.log(`成功更新 ${updateResult.modifiedCount} 条股票信息的版本号`);
    return updateResult.modifiedCount > 0;
  } catch (error) {
    console.error('更新股票信息版本号失败:', error.message);
    return false;
  }
};

const updateStockInfoPrefix = async () => {
  try {
    console.log('开始更新所有股票信息的前缀');

    // 上海证券交易所股票前缀设置为 SH
    const updateSHResult = await StockInfo.updateMany(
      {
        symbol: {
          $regex: /^(60|601|603|605|688)/
        },
        $or: [{ prefix: { $exists: false } }, { prefix: null }, { prefix: '' }]
      },
      { $set: { prefix: 'SH' } }
    );

    // 深圳证券交易所股票前缀设置为 SZ
    const updateSZResult = await StockInfo.updateMany(
      {
        symbol: {
          $regex: /^(000|001|002|003|004|300|301)/
        },
        $or: [{ prefix: { $exists: false } }, { prefix: null }, { prefix: '' }]
      },
      { $set: { prefix: 'SZ' } }
    );

    // 北京证券交易所股票前缀设置为 BJ
    const updateBJResult = await StockInfo.updateMany(
      {
        symbol: {
          $regex: /^(82|83|87|88|920)/
        },
        $or: [{ prefix: { $exists: false } }, { prefix: null }, { prefix: '' }]
      },
      { $set: { prefix: 'BJ' } }
    );

    const totalUpdated = updateSHResult.modifiedCount + updateSZResult.modifiedCount + updateBJResult.modifiedCount;
    console.log(`成功更新 ${totalUpdated} 条股票信息的前缀（上海: ${updateSHResult.modifiedCount}, 深圳: ${updateSZResult.modifiedCount}, 北京: ${updateBJResult.modifiedCount}）`);

    return totalUpdated > 0;
  } catch (error) {
    console.error('更新股票信息前缀失败:', error.message);
    return false;
  }
};


const getAllStockInfo = async () => {
  try {

    // 先确保所有记录都有 version 字段
    await updateStockInfoVersion();

    // 先确保所有记录都有 prefix 字段
    await updateStockInfoPrefix();

    // 获取所有股票信息
    const allRecords = await StockInfo.find();
    allStockInfo = allRecords;
    return allStockInfo;
  } catch (error) {
    console.error('加载股票信息失败:', error.message);
    return [];
  }
}

// 获取个股的基本信息，如公司行业、所属概念等
const getStockInfoBasic = async (item) => {
  const { symbol, prefix } = item;
  try {
    const response = await axios.get(
      `${AKShareServiceURL}/stock_individual_basic_info_xq?symbol=${prefix}${symbol}`
    );
    response.data.forEach(async (info) => {
      await StockInfo.updateOne({ symbol }, { $set: { main_operation_business: info.main_operation_business } }, { upsert: true });
    })
    return response.data;
  } catch (error) {
    console.error('加载股票信息失败:', error.message);
    return [];
  }
}

module.exports = {
  getStockInfo,
  isStockInfoStale,
  saveStockInfo,
  updateStockInfoVersion,
  updateStockInfoPrefix,
  getAllStockInfo,
  getStockInfoBasic,
};
