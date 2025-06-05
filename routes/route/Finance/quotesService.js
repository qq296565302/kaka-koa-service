/**
 * 行情数据
 */
const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const wsManager = require("../../../utils/websocketManager");
const { saveState, loadState } = require("../../../utils/stateStorage");
const { tradeCalendar } = require("./common");

/**
 * 获取公共行情（上证指数、深证指数、创业板指数、科创50）
 * 上证指数 SH000001
 * 深证指数 SZ399001
 * 创业板指数 SZ399006
 * 科创50 SH000688
 */
const publicQuotes = ["000001", "399001", "399006", "000688"];

// TODO 参数不全，start_date需要根据交易日判断，动态获取
/**
 * 获取指数历史分时行情数据，获取指数的分时数据，以及成交金额
 * @param {*} symbol
 * @param {*} start_date
 * @param {*} end_date
 * @returns
 */
const getPublicQuotesHistory = async (
  symbol,
  start_date = "",
  end_date = ""
) => {
  if (!start_date) {
    // 使用东八区时间
    const today = new Date().toISOString();
    const isTradingDay = tradeCalendar.some(
      (item) => item.trade_date === today
    );
    if (isTradingDay) {
      start_date = today.split("T")[0];
    } else {
      const index = tradeCalendar.findIndex((item) => item.trade_date > today);
      if (index === -1) {
        start_date =
          tradeCalendar[tradeCalendar.length - 1].trade_date.split("T")[0];
      } else {
        start_date = tradeCalendar[index - 1].trade_date.split("T")[0];
      }
    }
    start_date += " 09:30:00";
  }

  try {
    const responses = await Promise.all(
      publicQuotes.map((symbol) => {
        let url = `${AKShareServiceURL}/index_zh_a_hist_min_em?symbol=${symbol}&start_date=${start_date}`;
        if (end_date) {
          url += `&end_date=${end_date}`;
        }
        return axios.get(url, { timeout: 10000 });
      })
    );
    return responses.map((response) => response.data);
  } catch (error) {
    console.error("获取指数历史分时行情失败:", error.message);
    return [];
  }
};

const broadcastPublicQuotesHistory = async () => {
  const publicQuotesData = await getPublicQuotesHistory();
  if (publicQuotesData) {
    wsManager.broadcast({
      type: "public_quotes_history",
      data: publicQuotesData,
    });
  }
};

const getPublicQuotes = async () => {
  try {
    const url = `${AKShareServiceURL}/stock_zh_index_spot_em?symbol=沪深重要指数`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data.splice(0,4);
  } catch (error) {
    console.error("获取公共行情数据失败:", error.message);
    return [];
  }
};

const broadcastPublicQuotes = async () => {
  const publicQuotesData = await getPublicQuotes();
  wsManager.broadcast({
    type: "public_quotes_update",
    data: publicQuotesData,
  });
};

// 获取深圳个股实时数据 （东方财富）
async function getSZQuotes() {
  try {
    const fs = require("fs");
    const path = require("path");
    const url = `${AKShareServiceURL}/stock_sz_a_spot_em`;
    const responses = await axios.get(url, { timeout: 10000 });

    // 根据股票代码分类数据
    const szData = [];
    const cyData = [];

    if (Array.isArray(responses.data)) {
      responses.data.forEach((item) => {
        // 检查股票代码
        if (item.代码 && typeof item.代码 === "string") {
          const code = item.代码;
          if (code.startsWith("000")) {
            szData.push(item);
          } else if (code.startsWith("300")) {
            cyData.push(item);
          }
        }
      });

      // 确保目录存在
      const dataDir = path.join(__dirname, "../../../data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 写入SZ数据
      const szFilePath = path.join(dataDir, "SZQuotes.json");
      fs.writeFileSync(
        szFilePath,
        JSON.stringify(
          {
            time: new Date().toLocaleString("zh-CN", {
              timeZone: "Asia/Shanghai",
            }),
            data: szData,
          },
          null,
          2
        ),
        "utf8"
      );
      console.log(`已将000开头的股票数据存入 ${szFilePath}`);

      // 写入CY数据
      const cyFilePath = path.join(dataDir, "CYQuotes.json");
      fs.writeFileSync(
        cyFilePath,
        JSON.stringify(
          {
            time: new Date().toLocaleString("zh-CN", {
              timeZone: "Asia/Shanghai",
            }),
            data: cyData,
          },
          null,
          2
        ),
        "utf8"
      );
      console.log(`已将300开头的股票数据存入 ${cyFilePath}`);
    }

    return responses.data;
  } catch (error) {
    console.error("获取深圳个股实时数据失败:", error.message);
    return [];
  }
}

// 尝试从存储加载交易状态
try {
  const savedState = loadState();
  if (savedState && savedState.tradeStatus) {
    tradeStatus = savedState.tradeStatus;
    console.log("已从存储加载交易状态:", tradeStatus);
  }
} catch (error) {
  console.error("加载交易状态失败:", error);
}


module.exports = {
  tradeStatus, // * 交易状态
  getPublicQuotes,
  getPublicQuotesHistory,
  getSZQuotes, // * 获取深圳个股实时数据
  broadcastPublicQuotes, // * 广播公共行情数据
};

// 每5秒钟自动获取一次实时行情数据

let quotesTimer = setInterval(async () => {
  if (tradeStatus === "1") {
    // broadcastPublicQuotes(); // 广播公共行情数据
    // broadcastPublicQuotesHistory(); // 广播指数分时数据
  }
}, 5000);

process.on("exit", () => {
  clearInterval(quotesTimer);
});
