# coa-allin-pay

[![GitHub license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![npm version](https://img.shields.io/npm/v/coa-allin-pay.svg?style=flat-square)](https://www.npmjs.org/package/coa-allin-pay)
[![npm downloads](https://img.shields.io/npm/dm/coa-allin-pay.svg?style=flat-square)](http://npm-stat.com/charts.html?package=coa-allin-pay)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/coajs/coa-allin-pay/pulls)

通联支付SDK for Node.js

通联支付是一家综合支付和金融服务提供商，详见 [官方网站](https://www.allinpay.com/)

## 说明

- 本SDK主要自用，封装了大部分经常使用到的接口服务，更多的内容后续会根据实际使用情况添加。如果你也正好需要，欢迎一块补充。
- 服务的方法名称和通联接口文档完全对应，如果你有通联的接口文档，可以直接对照文档直接使用，避免不少踩坑的过程。

## 快速开始

### 安装

```shell
yarn add coa-allin-pay
```

### 直接使用

```typescript
import { AllinPayMemberService, AllinPayMerchantService, AllinPayOrderService } from 'coa-allin-pay'

// 相关配置
const allinPayConfig = {
  isProd: true,                             // 是否是生成环境
  endpoint: 'https://fintech.allinpay.com', // 通商云的服务地址
  notify: 'https://example.com',            // 自己的通知地址
  accountSetNo: '200100',                   // 子账户集
  sysId: '19022714235304000000',            // 客户编号
  privateKey: 'XXXXXXXXXXXXXXXXXXXXXXX',    // 商户私钥
  allinPublicKey: 'XXXXXXXXXXXXXXXXXXXXX',  // 通商云公钥
  bankPrivateKey: 'XXXXXXXXXXXXXXXXXXXXX',  // 银行私钥
}

// 成员相关服务
const memberService = new AllinPayMemberService(allinPayConfig)

// 商户相关服务
const merchantService = new AllinPayMerchantService(allinPayConfig)

// 订单相关服务
const orderService = new AllinPayOrderService(allinPayConfig)
```

> 三个服务的方法可详见通联接口文档