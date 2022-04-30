import { die } from 'coa-error'
import { dayjs, _ } from 'coa-helper'
import { AllinPayService } from '../libs/AllinPayService'
import { AllinPay } from '../typings'

/**
 * 订单接口
 * 商户业务系统需将业务订单与支付订单（通商云）以分层的方式处理，即在业务订单需支付时才向通商云请求订单申请
 * (1) 可实现业务系统商品订单用户支付失败时，可以再次对商品订单发起支付；
 * (2) 可实现业务系统商品订单的自定义有效期；通商云未支付的订单，每天日终（00:30）批量关闭已创建未支付，且创建时间大于 24 小时的订单。
 * (3) 可实现业务系统商品订单多次多笔支付。
 * (4) 避免渠道端因支付时效控制关闭支付订单后，影响原业务订单的支付。
 * (5) 为提升客户订单交易安全性，确保平台业务合理性，对会员订单（含订单状态成功及进行中）频次进行控制
 *  A-每个个人会员（或企业会员）调用“充值”接口单日限制 10 笔；
 *  B-每个个人会员（或企业会员）作为付款人调用“消费”接口单日限制 10 笔；
 *  C-每个个人会员（或企业会员）作为付款人调用“托管代收”接口单日限制 10 笔。
 * (6) 订单金额 amount 支持最大金额-9223372036854775807 单位分
 * (7) 收银宝 POS 当面付查询模式（支付方式 ORDER_VSPPAY），支持订单申请时上送“summary 摘要”在 POS 机保留字段显示。
 *—
 */
export class AllinPayOrderService extends AllinPayService {
  /**
   * 消费申请(微信小程序)
   * 1) 消费申请接口请求响应成功后，根据支付方式确认是否调用“支付确认”接口
   * 2) 可支持 B2C 商户自营商品的消费收款，收款人为：#yunBizUserId_B2C#
   * 3) 收款方需实名才能收款，个人会员需实名认证，企业会员需审核通过；
   * @param payerId 付款方商户系统用户标识，商户 系统中唯一编号。
   * @param bizOrderNo 商户订单号（支付订单）
   * @param amount 订单金额
   * @param openId 微信小程序的openId
   * @param summary 订单摘要信息
   */
  async consumeApplyWxa(bizOrderNo: string, payerId: string, openId: string, amount: number, summary = '') {
    const param = {
      payerId,
      recieverId: '#yunBizUserId_B2C#',
      bizOrderNo,
      amount,
      fee: 0,
      payMethod: {
        WECHATPAY_MINIPROGRAM_OPEN: {
          wxAppId: this.config.wxMiniPay.appWxaId,
          wxMchtId: this.config.wxMiniPay.mchId,
          amount,
          limitPay: '',
          acct: openId,
          cusip: '0.0.0.0',
        },
      },
      validateType: 0,
      summary: summary.slice(0, 20),
      extendInfo: summary.slice(0, 50),
      source: 1,
      industryCode: '1910',
      industryName: '其他',
      backUrl: this.config.notify + 'trade_pay',
    }
    const result = await this.bin.service_soa('OrderService', 'consumeApply', param)

    // 如果支付状态为失败
    if (result.payStatus === 'fail') die.hint('支付消费异常：' + result.payFailMessage)

    return result as {
      bizUserId: string
      bizOrderNo: string
      orderNo: string
      payStatus: 'success' | 'pending'
      payInfo: Record<string, any>
    }
  }

  /**
   * 消费申请(服务商微信小程序)
   * @param payerId 付款方商户系统用户标识，商户 系统中唯一编号。
   * @param bizOrderNo 商户订单号（支付订单）
   * @param amount 订单金额
   * @param openId 微信小程序的openId
   * @param summary 摘要
   */
  async consumeApplyWxaIsv(bizOrderNo: string, payerId: string, openId: string, amount: number, summary = '') {
    const param = {
      payerId,
      recieverId: '#yunBizUserId_B2C#',
      bizOrderNo,
      amount,
      fee: 0,
      payMethod: {
        WECHATPAY_MINIPROGRAM_OPEN_SERVICE: {
          subAppId: this.config.wxSubMiniPay.appWxaId,
          subMchtId: this.config.wxSubMiniPay.mchId,
          amount,
          limitPay: '',
          acct: openId,
          cusip: '0.0.0.0',
        },
      },
      validateType: 0,
      summary: summary.slice(0, 20),
      extendInfo: summary.slice(0, 50),
      source: 1,
      industryCode: '1910',
      industryName: '其他',
      backUrl: this.config.notify + 'trade_pay',
    }
    const result = await this.bin.service_soa('OrderService', 'consumeApply', param)

    // 如果支付状态为失败
    if (result.payStatus === 'fail') die.hint('支付消费异常：' + result.payFailMessage)

    return result as {
      bizUserId: string
      bizOrderNo: string
      orderNo: string
      payStatus: 'success' | 'pending'
      payInfo: Record<string, any>
    }
  }

  /**
   * 消费申请(通联通集团模式)
   * @param payerId 付款方商户系统用户标识，商户 系统中唯一编号。
   * @param bizOrderNo 商户订单号（支付订单）
   * @param amount 订单金额
   * @param openId 微信小程序的openId
   * @param summary 摘要
   * @param extendOption 扩展配置
   * @param extendParams 扩展参数
   */
  async consumeApplyWxaOrg(
    bizOrderNo: string,
    payerId: string,
    openId: string,
    amount: number,
    goodsName: string,
    summary = '',
    extendOption: { [key: string]: any } = {},
    extendParams: { frontUrl?: string } = {}
  ) {
    const param = {
      payerId,
      recieverId: '#yunBizUserId_B2C#',
      bizOrderNo,
      amount,
      fee: 0,
      payMethod: {
        WECHATPAY_MINIPROGRAM_ORG: {
          vspCusid: extendOption?.vspCusId || this.config.wxOrgMiniPay.vspCusId,
          subAppid: extendOption?.subAppWxaId || this.config.wxOrgMiniPay.subAppWxaId,
          limitPay: extendOption?.limitPay || this.config.wxOrgMiniPay.limitPay,
          amount,
          acct: openId,
        },
      },
      validateType: 0,
      summary: summary.slice(0, 20),
      extendInfo: summary.slice(0, 50),
      source: 1,
      industryCode: '1910',
      industryName: '其他',
      backUrl: this.config.notify + 'trade_pay',
      goodsName: goodsName || '订单' + bizOrderNo,
      ...extendParams,
    }
    const result = await this.bin.service_soa('OrderService', 'consumeApply', param)

    // 如果支付状态为失败
    if (result.payStatus === 'fail') die.hint('支付消费异常：' + result.payFailMessage)

    // 处理payInfo
    if (typeof result.payInfo === 'string') result.payInfo = JSON.parse(result.payInfo)

    return result as {
      bizUserId: string
      bizOrderNo: string
      orderNo: string
      payStatus: 'success' | 'pending'
      payInfo: Record<string, any>
    }
  }

  /**
   * 消费申请(H5通联通集团模式)
   * @param payerId 付款方商户系统用户标识，商户 系统中唯一编号。
   * @param bizOrderNo 商户订单号（支付订单）
   * @param amount 订单金额
   * @param openId 微信公众号的openId
   * @param summary 摘要
   * @param extendOption 扩展配置
   * @param extendParams 扩展参数
   */
  async consumeApplyWxbOrg(
    bizOrderNo: string,
    payerId: string,
    openId: string,
    amount: number,
    goodsName: string,
    summary = '',
    extendOption: { [key: string]: any } = {},
    extendParams: { frontUrl?: string } = {}
  ) {
    const param = {
      payerId,
      recieverId: '#yunBizUserId_B2C#',
      bizOrderNo,
      amount,
      fee: 0,
      payMethod: {
        WECHAT_PUBLIC_ORG: {
          vspCusid: extendOption?.vspCusId || this.config.wxOrgMiniPay.vspCusId,
          subAppid: extendOption?.subAppWxaId || this.config.wxOrgMiniPay.subAppWxaId,
          limitPay: extendOption?.limitPay || this.config.wxOrgMiniPay.limitPay,
          amount,
          acct: openId,
        },
      },
      validateType: 0,
      summary: summary.slice(0, 20),
      extendInfo: summary.slice(0, 50),
      source: 1,
      industryCode: '1910',
      industryName: '其他',
      backUrl: this.config.notify + 'trade_pay',
      goodsName: goodsName || '订单' + bizOrderNo,
      ...extendParams,
    }
    const result = await this.bin.service_soa('OrderService', 'consumeApply', param)

    // 如果支付状态为失败
    if (result.payStatus === 'fail') die.hint('支付消费异常：' + result.payFailMessage)

    // 处理payInfo
    if (typeof result.payInfo === 'string') result.payInfo = JSON.parse(result.payInfo)

    return result as {
      bizUserId: string
      bizOrderNo: string
      orderNo: string
      payStatus: 'success' | 'pending'
      payInfo: Record<string, any>
    }
  }

  /**
   * 消费申请(收银宝H5集团模式)
   * @param payerId 付款方商户系统用户标识，商户 系统中唯一编号。
   * @param bizOrderNo 商户订单号（支付订单）
   * @param amount 订单金额
   * @param summary 摘要
   * @param extendOption 扩展配置
   * @param extendParams 扩展参数
   */
  async consumeApplyH5VspOrg(
    bizOrderNo: string,
    payerId: string,
    amount: number,
    goodsName: string,
    summary = '',
    extendOption: { [key: string]: any } = {},
    extendParams: { frontUrl?: string } = {}
  ) {
    const param = {
      payerId,
      recieverId: '#yunBizUserId_B2C#',
      bizOrderNo,
      amount,
      fee: 0,
      payMethod: {
        H5_CASHIER_VSP_ORG: {
          vspCusid: extendOption?.vspCusId || this.config.wxOrgMiniPay.vspCusId,
          limitPay: extendOption?.limitPay || this.config.wxOrgMiniPay.limitPay,
          amount,
        },
      },
      validateType: 0,
      summary: summary.slice(0, 20),
      extendInfo: summary.slice(0, 50),
      source: 1,
      industryCode: '1910',
      industryName: '其他',
      backUrl: this.config.notify + 'trade_pay',
      goodsName: goodsName || '订单' + bizOrderNo,
      ...extendParams,
    }
    const result = await this.bin.service_soa('OrderService', 'consumeApply', param)

    // 如果支付状态为失败
    if (result.payStatus === 'fail') die.hint('支付消费异常：' + result.payFailMessage)

    // 处理payInfo
    if (typeof result.payInfo === 'string') result.payInfo = JSON.parse(result.payInfo)

    return result as {
      bizUserId: string
      bizOrderNo: string
      orderNo: string
      payStatus: 'success' | 'pending'
      payInfo: Record<string, any>
    }
  }

  /**
   * 查询订单状态
   * @param bizOrderNo 商户订单号（支付订单）
   */
  async getOrderDetail(bizOrderNo: string) {
    const param = { bizOrderNo }
    const result = await this.bin.service_soa('OrderService', 'getOrderDetail', param)
    return result as AllinPay.OrderDetail
  }

  /**
   * 退款申请
   * 1) 支持充值、消费、托管代收（未代付、已代付）、平台转账订单发起退款。
   * 2) 支持个人会员、企业会员相关订单的退款，不支持平台发起订单的退款。
   * 3) 发起退款时，请确保退款账户（原订单收款账户）中有足够的可用余额；支持全额退款、部分金额退款，但 退款金额不得超过原订单金额。
   * 4) 渠道支持退款则退款金额原路返回，可通过字段“refundType 退款方式”指定退款向支付渠道发起时间。
   * 5) 不支持通过 SOA 接口发起退款的支付方式：收银宝订单 POS，收银宝当面付；需通过 POS 终端或当面付公众 号内发起退款，系统后台根据终端创建订单后通过“当面付标准模式支付及收银宝 POS 订单支付订单补登” 接口返回商户。查询模式的充值、消费订单支持全额退款和部分退款；托收订单不支持部分退款，仅支持全 额退款；
   * 6) 仅支持退款至余额的支付方式：POS 支付-实名付、山东代收。
   * 7) 原订单支付方式包含代金券的，将代金券金额原路退回至平台营销账户/平台保证金账户。
   * 8) 原订单有分账的也支持退款，但需要原订单收款方承担分账资金。
   * 9) 原订单支付收取了手续费的，支持手续费全额退款、部分金额退款、不退款，通过 feeAmount 参数定义。
   * 10) 原订单使用组合支付的，先做渠道退款，再做余额退款。
   * 11) 退款时 amount 是本次退款总金额，feeAmount 是平台需支付的手续费退款金额 A-平台不退手续费，退款 amount 需小于等于原支付单的 amount 减去 fee 的值；feeAmount 不填 B-平台退手续费，退款 amount 需小于等于原支付单的 amount，退款时 feeAmount 需小于等于原支付单的 fee
   * @param bizUserId 付款方商户系统用户标识，商户 系统中唯一编号。
   * @param bizOrderNo 商户订单号（支付订单）
   * @param oriBizOrderNo 商户原订单号（需要退款的原交易订单号）
   * @param amount 订单金额
   * @param type 退款类型 trade_refund transfer_refund
   */
  async refund(
    bizOrderNo: string,
    oriBizOrderNo: string,
    bizUserId: string,
    amount: number,
    type: 'trade_refund' | 'transfer_refund'
  ) {
    const param = {
      bizOrderNo,
      oriBizOrderNo,
      bizUserId,
      amount,
      refundType: 'D0',
      backUrl: this.config.notify + type,
    }
    const result = await this.bin.service_soa('OrderService', 'refund', param)

    // 如果支付状态为失败
    if (result.payStatus === 'fail') die.hint('退款申请异常：' + result.payFailMessage)

    return result as {
      orderNo: string
      bizOrderNo: string
      payStatus: 'success' | 'pending'
      amount: number
    }
  }

  // 交易退款
  async trade_refund(refundId: string, orderId: string, bizUserId: string, amount: number) {
    return await this.refund(refundId, orderId, bizUserId, amount, 'trade_refund')
  }

  // 平台转账退款
  async transfer_refund(transferRefundId: string, transferId: string, amount: number) {
    return await this.refund(transferRefundId, transferId, '#yunBizUserId_B2C#', amount, 'transfer_refund')
  }

  /**
   * 提现申请
   * 1. 创建提现订单需要先绑定手机，个人用户还需完成实名认证，企业用户需通过企业信息审核。
   * 2. 个人会员只能提现到绑定的银行卡中，设置了安全卡的，只能提现到安全卡中。
   * 3. 企业会员提现交易，默认使用企业对公账户。如需提现到个人银行卡，可通过绑定银行卡相关接口绑定个人银行账户，企业会员最多只允许绑定一张法人个人银行卡。
   * 4. 如果平台已设置为“必须使用安全卡提现”，则提现银行卡必须为安全卡。
   * 5. 提现订单支付成功的条件为：status = OK 且 payStatus = success。
   * 企业用户使用绑定的法人个人银行卡提现流程：
   * 1) 企业信息审核成功。
   * 2) 通过请求绑定银行卡接口绑定法人个人银行卡。
   * 3) 通过确认绑定银行卡接口完成银行预留手机短信校验，绑卡成功。
   * 4) 通过提现申请接口发起提现交易。
   * 5) 通过支付确认接口确认提现交易(企业用户请使用【后台+短信验证码验证】方式）。
   * 个人用户使用绑定的个人银行卡提现流程：
   * 1) 通过请求绑定银行卡接口绑定个人银行卡。
   * 2) 通过确认绑定银行卡接口完成银行预留手机短信校验，绑卡成功。
   * 3) 通过提现申请接口发起提现交易。
   * 4) 通过支付确认接口确认提现交易。
   * @param bizOrderNo 商户订单号（支付订单）
   * @param bizUserId 商户系统用户标识，商户系统中唯一编号
   * @param subAcctNo 子账户号
   * @param bankCardNo 银行卡号
   * @param name 姓名
   * @param amount 订单金额
   */
  async withdrawApplyHT(
    bizOrderNo: string,
    bizUserId: string,
    subAcctNo: string,
    bankCardNo: string,
    name: string,
    amount: number
  ) {
    const accountSetNo = this.config.accountSetNo
    const withdrawType = 'D0'

    const param = {
      bizOrderNo,
      bizUserId,
      accountSetNo,
      amount,
      fee: 0,
      validateType: 0,
      bankCardNo,
      withdrawType,
      payMethod: {
        WITHDRAW_HTBANK: {
          subAcctNo,
          PAYEE_ACCT_NO: bankCardNo,
          PAYEE_ACCT_NAME: name,
          AMOUNT: amount,
          SUMMARY: '',
          SIGNED_MSG_MER: this.bin.bank_signer(bankCardNo, name, amount.toString()),
        },
      },
      source: 1,
      industryCode: '1910',
      industryName: '其他',
      backUrl: this.config.notify + 'withdraw',
    }
    this.bin.param_encrypt(param, ['bankCardNo'])

    const result = await this.bin.service_soa('OrderService', 'withdrawApply', param)

    // 如果支付状态为失败
    if (result.payStatus === 'fail') die.hint('提现申请异常：' + result.payFailMessage)

    _.assign(result, { accountSetNo, withdrawType })

    return result as {
      bizUserId: string
      bizOrderNo: string
      orderNo: string
      accountSetNo: string
      withdrawType: string
      payStatus: 'success' | 'pending'
      payInfo: string
    }
  }

  // 申请提现（TLT存管模式）
  async withdrawApplyTLT(bizOrderNo: string, bizUserId: string, bankCardNo: string, amount: number) {
    const accountSetNo = this.config.accountSetNo
    const withdrawType = 'D0'

    const param = {
      bizOrderNo,
      bizUserId,
      accountSetNo,
      amount,
      fee: 0,
      validateType: 0,
      bankCardNo,
      withdrawType,
      payMethod: {
        WITHDRAW_TLT: {
          payTypeName: 'withdraw_tlt',
        },
      },
      source: 1,
      industryCode: '1910',
      industryName: '其他',
      backUrl: this.config.notify + 'withdraw',
    }
    this.bin.param_encrypt(param, ['bankCardNo'])

    const result = await this.bin.service_soa('OrderService', 'withdrawApply', param)

    // 如果支付状态为失败
    if (result.payStatus === 'fail') die.hint('提现申请异常：' + result.payFailMessage)

    _.assign(result, { accountSetNo, withdrawType })

    return result as {
      bizUserId: string
      bizOrderNo: string
      orderNo: string
      accountSetNo: string
      withdrawType: string
      payStatus: 'success' | 'pending'
      payInfo: string
    }
  }

  /**
   * 平台转账
   * 该接口一般用于平台向用户发红包、各类代金券、体验金、购物返利等营销活动。
   * 1. 目前只支持从平台标准余额账户集、保证金账户、营销专用账户、预付卡账户集和自定义 A 帐户转账到用户托管账户余额。
   * 2. 源帐户集：标准余额账户集、平台保证金账户、营销专用账户、预付卡账户集和自定义 A 帐户所属的账户集。
   * 3. 目标账户集：通商云分配给业务端的托管专用账户集。
   * 4. 平台转账无需支付确认，无异步通知。
   * @param bizTransferNo 商户系统转账订单号，商户系统唯一
   * @param targetBizUserId 目标商户系统用户标识，商户系统中唯一编号。
   * @param amount 金额
   */
  async applicationTransfer(bizTransferNo: string, targetBizUserId: string, amount: number) {
    const param = {
      bizTransferNo,
      sourceAccountSetNo: '100001',
      targetBizUserId,
      targetAccountSetNo: this.config.accountSetNo,
      amount,
    }
    const result = await this.bin.service_soa('OrderService', 'applicationTransfer', param)
    _.defaults(result, param)
    return result as {
      transferNo: string
      bizTransferNo: string
      amount: number
      sourceAccountSetNo: string
      targetAccountSetNo: string
    }
  }

  /**
   * 查询用户账户余额
   * @param bizUserId
   */
  async queryBalance(bizUserId: string) {
    const param = { bizUserId, accountSetNo: this.config.accountSetNo }
    const result = await this.bin.service_soa('OrderService', 'queryBalance', param)
    return result as { allAmount: number; freezenAmount: number }
  }

  /**
   * 查询用户账户收支明细
   * 返回明细以时间倒序排列
   * @param bizUserId 商户系统用户标识，商户系统中唯一编号。
   * @param dateStart 开始日期
   * @param dateEnd 结束日期 最多允许查1个月内，跨度建议不超过7天
   * @param startPosition 起始位置，取值>0 eg：查询第 11 条到 20 条的 记录（start =11）
   * @param queryNum 查询条数，eg：查询第 11 条到 20 条的 记录（queryNum =10）， 查询条数最多 5000
   */
  async queryInExpDetail(
    bizUserId: string,
    dateStart: dayjs.Dayjs,
    dateEnd: dayjs.Dayjs,
    startPosition = 1,
    queryNum = 5000
  ) {
    const param = {
      bizUserId,
      startPosition,
      queryNum,
      dateStart: dateStart.format('YYYY-MM-DD'),
      dateEnd: dateEnd.format('YYYY-MM-DD'),
    }
    const result = await this.bin.service_soa('OrderService', 'queryInExpDetail', param)
    return result as {
      totalNum: string
      inExpDetail: AllinPay.InExpDetail[]
      bizUserId: string
    }
  }
}
