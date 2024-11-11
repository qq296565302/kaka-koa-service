#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const getPathInfo = (p) => path.parse(p); // 解析文件路径并返回一个包含路径信息的对象

/**
 * @description 一个灵活的文件加载机制，可以根据指定的目录、是否查询子目录和文件后缀列表来自动加载文件，并返回一个包含文件信息的对象数组。
 * @param {String} directory 文件目录
 * @param {Boolean} useSubdirectories 是否查询子目录，默认false
 * @param {array} extList 查询文件后缀，默认 ['.js']
 */
const autoLoadFile = (
  directory,
  useSubdirectories = false,
  extList = [".js"]
) => {
  // 存储找到的文件路径
  const filesList = [];
  // 递归读取文件
  function readFileList(directory, useSubdirectories, extList) {
    // 同步读取指定目录下的所有文件和目录
    const files = fs.readdirSync(directory);
    files.forEach((item) => {
      // 将目录路径和文件名拼接成完整的文件路径
      const fullPath = path.join(directory, item);
      // 获取文件或目录的状态信息
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && useSubdirectories) {
        readFileList(path.join(directory, item), useSubdirectories, extList);
      } else {
        const info = getPathInfo(fullPath);
        extList.includes(info.ext) && filesList.push(fullPath);
      }
    });
  }
  readFileList(directory, useSubdirectories, extList);
  // 生成需要的对象
  const res = filesList.map((item) => ({
    path: item,
    data: require(item),
    ...getPathInfo(item),
  }));
  return res;
};

module.exports = autoLoadFile;
