/**
 * * 企业动态
 * * 
 */

const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const wsManager = require("../../../utils/websocketManager");
const MarketEffect = require("../../../models/MarketEffect");

const saveCompanyDynamics = async (date) => {
  try {
    const response = await axios.get(`${AKShareServiceURL}/stock_gsrl_gsdt_em?date=${date}`);
    const data = response.data;
    return data;
  } catch (error) {
    console.error("保存企业动态数据失败:", error);
  }
};

module.exports = {
  saveCompanyDynamics
}