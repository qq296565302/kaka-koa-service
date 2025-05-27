# MongoDB 查询方法指南

本文档详细介绍了在 Node.js 环境中使用 Mongoose 操作 MongoDB 数据库的各种查询方法。

## 目录

1. [基本查询方法](#基本查询方法)
2. [条件查询](#条件查询)
3. [逻辑查询](#逻辑查询)
4. [字段投影](#字段投影)
5. [正则表达式查询](#正则表达式查询)
6. [分页查询](#分页查询)
7. [排序](#排序)
8. [聚合查询](#聚合查询)
9. [更新方法](#更新方法)
10. [删除方法](#删除方法)
11. [高级查询技巧](#高级查询技巧)

## 基本查询方法

### find() - 查询多条记录

```javascript
// 查询所有记录
const allRecords = await Model.find();

// 查询符合条件的记录
const records = await Model.find({ field: value });

// 查询结果是一个数组，即使没有匹配的记录，也会返回空数组 []
```

### findOne() - 查询单条记录

```javascript
// 查询符合条件的第一条记录
const record = await Model.findOne({ field: value });

// 如果没有匹配的记录，返回 null
```

### findById() - 通过 _id 查询单条记录

```javascript
// 通过 _id 查询记录
const record = await Model.findById('60d21b4667d0d8992e610c85');

// 等同于
const sameRecord = await Model.findOne({ _id: '60d21b4667d0d8992e610c85' });

// 如果没有匹配的记录，返回 null
```

### countDocuments() - 计数查询

```javascript
// 计算符合条件的记录数量
const count = await Model.countDocuments({ field: value });

// 计算所有记录的数量
const totalCount = await Model.countDocuments();
```

### exists() - 检查是否存在

```javascript
// 检查是否存在符合条件的记录
const exists = await Model.exists({ field: value });

// 返回 null 或包含 _id 的对象
```

## 条件查询

### 等于查询

```javascript
// 字段等于指定值
const records = await Model.find({ field: value });
```

### 不等于查询

```javascript
// 字段不等于指定值
const records = await Model.find({ field: { $ne: value } });
```

### 比较查询

```javascript
// 大于
const greaterThan = await Model.find({ field: { $gt: value } });

// 小于
const lessThan = await Model.find({ field: { $lt: value } });

// 大于等于
const greaterThanOrEqual = await Model.find({ field: { $gte: value } });

// 小于等于
const lessThanOrEqual = await Model.find({ field: { $lte: value } });
```

### 包含查询

```javascript
// 字段值包含在指定数组中
const inArray = await Model.find({ field: { $in: [value1, value2, value3] } });

// 字段值不包含在指定数组中
const notInArray = await Model.find({ field: { $nin: [value1, value2, value3] } });
```

### 存在性查询

```javascript
// 查询存在某个字段的记录
const fieldExists = await Model.find({ field: { $exists: true } });

// 查询不存在某个字段的记录
const fieldNotExists = await Model.find({ field: { $exists: false } });
```

### 类型查询

```javascript
// 查询字段为特定类型的记录
// BSON 类型：1-Double, 2-String, 3-Object, 4-Array, 8-Boolean, 9-Date, 10-Null, 16-Int32, 18-Int64
const stringFields = await Model.find({ field: { $type: 2 } });
const numberFields = await Model.find({ field: { $type: 16 } });
```

## 逻辑查询

### AND 查询

```javascript
// 方法 1：隐式 AND（多个条件）
const andQuery1 = await Model.find({
  field1: value1,
  field2: value2
});

// 方法 2：显式 AND
const andQuery2 = await Model.find({
  $and: [
    { field1: value1 },
    { field2: value2 }
  ]
});
```

### OR 查询

```javascript
// OR 查询
const orQuery = await Model.find({
  $or: [
    { field1: value1 },
    { field2: value2 }
  ]
});
```

### NOR 查询

```javascript
// NOR 查询（与 OR 相反，两个条件都不满足）
const norQuery = await Model.find({
  $nor: [
    { field1: value1 },
    { field2: value2 }
  ]
});
```

### 复合逻辑查询

```javascript
// 复合逻辑查询（AND + OR）
const complexQuery = await Model.find({
  field1: value1,
  $or: [
    { field2: value2 },
    { field3: value3 }
  ]
});

// 更复杂的嵌套查询
const nestedQuery = await Model.find({
  $or: [
    { field1: value1 },
    {
      $and: [
        { field2: { $gt: value2 } },
        { field3: { $lt: value3 } }
      ]
    }
  ]
});
```

## 字段投影

### 包含特定字段

```javascript
// 只返回特定字段（包括 _id）
const projection1 = await Model.find({}, 'field1 field2');

// 等同于
const projection2 = await Model.find({}, { field1: 1, field2: 1 });
```

### 排除特定字段

```javascript
// 排除特定字段
const excludeFields = await Model.find({}, { field1: 0, field2: 0 });
```

### 排除 _id 字段

```javascript
// 排除 _id 字段
const excludeId = await Model.find({}, { _id: 0, field1: 1, field2: 1 });
```

## 正则表达式查询

### 基本正则查询

```javascript
// 使用正则表达式进行模糊查询
const regexQuery1 = await Model.find({ field: /pattern/ });

// 等同于
const regexQuery2 = await Model.find({ field: { $regex: 'pattern' } });
```

### 不区分大小写

```javascript
// 不区分大小写的正则查询
const caseInsensitive1 = await Model.find({ field: /pattern/i });

// 等同于
const caseInsensitive2 = await Model.find({
  field: { $regex: 'pattern', $options: 'i' }
});
```

### 常用正则模式

```javascript
// 以特定字符串开头
const startsWith = await Model.find({ field: /^prefix/ });

// 以特定字符串结尾
const endsWith = await Model.find({ field: /suffix$/ });

// 包含特定字符串
const contains = await Model.find({ field: /substring/ });
```

## 分页查询

### 基本分页

```javascript
// 跳过前 10 条记录，获取接下来的 5 条
const page = await Model.find()
  .skip(10)
  .limit(5);
```

### 带条件的分页

```javascript
// 带条件的分页查询
const conditionPage = await Model.find({ field: value })
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize);
```

### 计算总页数

```javascript
// 计算总记录数和总页数
const count = await Model.countDocuments({ field: value });
const totalPages = Math.ceil(count / pageSize);

// 返回分页数据和分页信息
const result = {
  data: await Model.find({ field: value })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize),
  pagination: {
    total: count,
    pageSize,
    currentPage: pageNumber,
    totalPages
  }
};
```

## 排序

### 单字段排序

```javascript
// 升序排序（1 或 'asc'）
const ascending = await Model.find().sort({ field: 1 });
// 或
const ascending2 = await Model.find().sort({ field: 'asc' });

// 降序排序（-1 或 'desc'）
const descending = await Model.find().sort({ field: -1 });
// 或
const descending2 = await Model.find().sort({ field: 'desc' });
```

### 多字段排序

```javascript
// 多字段排序（先按 field1 升序，再按 field2 降序）
const multiSort = await Model.find().sort({ field1: 1, field2: -1 });
```

### 组合查询和排序

```javascript
// 组合条件查询、分页和排序
const combined = await Model.find({ field1: value1 })
  .sort({ field2: -1 })
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize);
```

## 聚合查询

### 基本聚合

```javascript
// 基本聚合查询
const aggregation = await Model.aggregate([
  { $match: { field: value } },
  { $group: { _id: '$groupField', count: { $sum: 1 } } }
]);
```

### 分组计算

```javascript
// 按字段分组并计算总和、平均值、最大值、最小值
const stats = await Model.aggregate([
  { $match: { status: 'active' } },
  {
    $group: {
      _id: '$category',
      count: { $sum: 1 },
      totalAmount: { $sum: '$amount' },
      averageAmount: { $avg: '$amount' },
      maxAmount: { $max: '$amount' },
      minAmount: { $min: '$amount' }
    }
  },
  { $sort: { totalAmount: -1 } }
]);
```

### 聚合管道

```javascript
// 复杂聚合管道
const pipeline = await Model.aggregate([
  { $match: { createdAt: { $gte: new Date('2023-01-01') } } },
  { $project: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, amount: 1 } },
  { $group: { _id: { year: '$year', month: '$month' }, total: { $sum: '$amount' } } },
  { $sort: { '_id.year': 1, '_id.month': 1 } }
]);
```

### 查找并填充关联数据

```javascript
// 查找并填充关联数据（类似 SQL JOIN）
const lookupData = await Model.aggregate([
  { $match: { status: 'active' } },
  {
    $lookup: {
      from: 'relatedcollection',
      localField: 'foreignKey',
      foreignField: '_id',
      as: 'relatedData'
    }
  },
  { $unwind: '$relatedData' }
]);
```

## 更新方法

### updateOne() - 更新一条记录

```javascript
// 更新符合条件的第一条记录
const updateResult = await Model.updateOne(
  { field: value },  // 查询条件
  { $set: { field1: newValue1, field2: newValue2 } }  // 更新操作
);

// 返回结果包含：
// - acknowledged: 操作是否被确认
// - matchedCount: 匹配的文档数量
// - modifiedCount: 实际修改的文档数量
// - upsertedId: 如果使用 upsert 选项并创建了新文档，则包含新文档的 _id

// 实际例子：更新用户的邮箱
const userUpdate = await User.updateOne(
  { username: 'johndoe' },
  { $set: { email: 'newemail@example.com', lastUpdated: new Date() } }
);
```

### updateMany() - 更新多条记录

```javascript
// 更新所有符合条件的记录
const updateManyResult = await Model.updateMany(
  { status: 'pending' },  // 查询条件
  { $set: { status: 'processed', processedAt: new Date() } }  // 更新操作
);

// 实际例子：将所有过期产品标记为不可用
const productsUpdate = await Product.updateMany(
  { expiryDate: { $lt: new Date() } },
  { 
    $set: { 
      isAvailable: false,
      statusMessage: '产品已过期'
    }
  }
);
```

### findOneAndUpdate() - 查找并更新

```javascript
// 查找并更新记录，返回更新后的文档
const updatedDoc = await Model.findOneAndUpdate(
  { field: value },  // 查询条件
  { $set: { field1: newValue1 } },  // 更新操作
  { new: true }  // 选项：返回更新后的文档而不是更新前的
);

// 实际例子：递增计数器并返回新值
const counter = await Counter.findOneAndUpdate(
  { name: 'visitorCount' },
  { $inc: { value: 1 } },
  { new: true, upsert: true }  // 如果不存在则创建
);
console.log(`新的访问计数: ${counter.value}`);
```

### 更新操作符

```javascript
// $set: 设置字段值
await Model.updateOne({ _id: id }, { $set: { field: value } });

// $inc: 递增字段值
await Model.updateOne({ _id: id }, { $inc: { counter: 5 } });  // 增加 5

// $push: 向数组添加元素
await Model.updateOne({ _id: id }, { $push: { tags: 'newTag' } });

// $addToSet: 向数组添加元素（如果不存在）
await Model.updateOne({ _id: id }, { $addToSet: { tags: 'uniqueTag' } });

// $pull: 从数组移除元素
await Model.updateOne({ _id: id }, { $pull: { tags: 'oldTag' } });

// $unset: 删除字段
await Model.updateOne({ _id: id }, { $unset: { temporaryField: '' } });

// 实际例子：更新用户权限
const userPermissionUpdate = await User.updateOne(
  { username: 'admin' },
  { 
    $addToSet: { roles: 'superadmin' },  // 添加新角色（如果不存在）
    $pull: { restrictedFeatures: 'reports' },  // 移除限制
    $inc: { accessLevel: 10 },  // 提升访问级别
    $set: { lastPromoted: new Date() }  // 更新提升日期
  }
);
```

### 批量更新与原子操作

```javascript
// 使用 bulkWrite 进行批量更新
const bulkResult = await Model.bulkWrite([
  {
    updateOne: {
      filter: { _id: id1 },
      update: { $set: { status: 'processed' } }
    }
  },
  {
    updateMany: {
      filter: { category: 'electronics' },
      update: { $inc: { price: 10 } }
    }
  },
  {
    replaceOne: {
      filter: { _id: id3 },
      replacement: { name: 'New Document', createdAt: new Date() }
    }
  }
]);

// 实际例子：批量处理订单状态
const orderUpdates = await Order.bulkWrite([
  {
    updateMany: {
      filter: { status: 'pending', createdAt: { $lt: new Date('2023-01-01') } },
      update: { $set: { status: 'cancelled', reason: '超时未处理' } }
    }
  },
  {
    updateMany: {
      filter: { status: 'processing', updatedAt: { $lt: new Date('2023-06-01') } },
      update: { $set: { status: 'completed', completedAt: new Date() } }
    }
  }
]);
```

## 删除方法

### deleteOne() - 删除一条记录

```javascript
// 删除符合条件的第一条记录
const deleteResult = await Model.deleteOne({ field: value });

// 返回结果包含：
// - acknowledged: 操作是否被确认
// - deletedCount: 删除的文档数量

// 实际例子：删除特定用户
const userDeletion = await User.deleteOne({ email: 'user@example.com' });
console.log(`删除的用户数: ${userDeletion.deletedCount}`);
```

### deleteMany() - 删除多条记录

```javascript
// 删除所有符合条件的记录
const deleteManyResult = await Model.deleteMany({ status: 'inactive' });

// 实际例子：清理过期的临时数据
const tempDataCleanup = await TempData.deleteMany({
  expiryDate: { $lt: new Date() }
});
console.log(`已清理 ${tempDataCleanup.deletedCount} 条过期数据`);
```

### findOneAndDelete() - 查找并删除

```javascript
// 查找并删除记录，返回被删除的文档
const deletedDoc = await Model.findOneAndDelete({ field: value });

// 实际例子：处理队列中的下一个任务
const nextTask = await Task.findOneAndDelete(
  { status: 'pending' },
  { sort: { priority: -1, createdAt: 1 } }  // 先处理高优先级的旧任务
);

if (nextTask) {
  console.log(`处理任务: ${nextTask.name}`);
  // 处理任务的逻辑...
} else {
  console.log('队列中没有待处理的任务');
}
```

### findByIdAndDelete() - 通过 ID 查找并删除

```javascript
// 通过 ID 查找并删除记录
const deletedById = await Model.findByIdAndDelete(id);

// 实际例子：删除特定文章及其评论
const article = await Article.findByIdAndDelete('60d21b4667d0d8992e610c85');
if (article) {
  // 级联删除相关评论
  await Comment.deleteMany({ articleId: article._id });
  console.log(`已删除文章 "${article.title}" 及其所有评论`);
}
```

### 软删除模式

```javascript
// 软删除模式（标记为已删除而不是真正删除）
const softDelete = await Model.updateOne(
  { _id: id },
  { 
    $set: { 
      isDeleted: true,
      deletedAt: new Date()
    }
  }
);

// 查询时排除软删除的记录
const activeRecords = await Model.find({ isDeleted: { $ne: true } });

// 实际例子：软删除用户账户
const userSoftDelete = await User.updateOne(
  { username: 'johndoe' },
  {
    $set: {
      isDeleted: true,
      deletedAt: new Date(),
      status: 'inactive',
      deletionReason: '用户请求删除账户'
    }
  }
);
```

## 高级查询技巧

### 使用 lean() 提高性能

```javascript
// 使用 lean() 返回普通 JavaScript 对象而不是 Mongoose 文档
// 这可以显著提高性能，但会失去 Mongoose 文档的特性
const leanResults = await Model.find().lean();
```

### 使用 explain() 分析查询

```javascript
// 分析查询性能
const explanation = await Model.find({ field: value }).explain();
```

### 使用游标处理大量数据

```javascript
// 使用游标处理大量数据，避免内存溢出
const cursor = Model.find().cursor();

for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
  // 处理每个文档...
  console.log(doc);
}

// 或者使用 eachAsync
await Model.find().cursor().eachAsync(async (doc) => {
  // 处理每个文档...
  await processDocument(doc);
});
```

### 事务处理

```javascript
// 使用事务确保多个操作的原子性
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 在事务中执行操作
  const result1 = await Model1.updateOne(
    { _id: id1 },
    { $set: { field: value1 } },
    { session }
  );
  
  const result2 = await Model2.updateOne(
    { _id: id2 },
    { $set: { field: value2 } },
    { session }
  );
  
  // 提交事务
  await session.commitTransaction();
} catch (error) {
  // 出错时回滚事务
  await session.abortTransaction();
  throw error;
} finally {
  // 结束会话
  session.endSession();
}
```

### 复合索引和查询优化

```javascript
// 在 Schema 中定义复合索引
const schema = new mongoose.Schema({
  field1: String,
  field2: Number,
  field3: Date
});

// 创建复合索引
schema.index({ field1: 1, field2: -1 });

// 使用索引的查询
const optimizedQuery = await Model.find({
  field1: 'value',
  field2: { $gt: 100 }
}).sort({ field1: 1, field2: -1 });
```

---

本文档提供了 MongoDB 查询方法的详细指南，涵盖了从基础到高级的各种查询技巧。在实际应用中，可以根据具体需求组合使用这些方法，实现高效的数据库操作。

对于更复杂的查询需求，建议参考 [MongoDB 官方文档](https://docs.mongodb.com/) 和 [Mongoose 文档](https://mongoosejs.com/docs/)。
