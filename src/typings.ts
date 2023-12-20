const config = {
  endpoint: '',
  notify: '',
  sysId: '',
  accountSetNo: '',
  wxMiniPay: {
    mchId: '',
    appWxaId: '',
    appWxaName: '',
  },
  wxIsvMiniPay: {
    mchId: '',
    appWxaId: '',
    appWxaName: '',
  },
  wxOrgMiniPay: {
    vspCusId: '',
    subAppWxaId: '',
    limitPay: '',
  },
  wxSubMiniPay: {
    mchId: '',
    appWxaId: '',
    appWxaName: '',
  },
  wxOrgCashierPay: {
    vspCusId: '',
    limitPay: '',
  },
  bankAcct: {
    acctName: '',
    acctNo: '',
  },
  privateKey: Buffer.from([]),
  allinPublicKey: Buffer.from([]),
  bankPrivateKey: Buffer.from([]),
  platformBizUserId: '#yunBizUserId_B2C#',
  consumerIp: '8.133.183.55',
}

const memberInfo = {
  country: null,
  subAcctNo: '9120001000436901587',
  isSignContract: true,
  contractNo: '1265918142371078144',
  payFailAmount: 0,
  remark: null,
  source: 1,
  province: null,
  userState: 1,
  identityType: 1,
  ContractNo: '1265918142371078144',
  identityCardNo: '111',
  isSetPayPwd: false,
  acctOrgType: 1,
  signContractTime: '2020-05-28 16:09:39',
  area: null,
  registerIp: null,
  address: null,
  registerTime: '2020-05-26 20:16:54',
  signAgreementNum: '241',
  isIdentityChecked: true,
  userId: '004454b0-fc82-4c1e-885c-ea249dc1fbe9',
  isPhoneChecked: true,
  realNameTime: '2020-05-28 01:01:32',
  phone: '15010001001',
  name: '111',
}

const bankCardInfo = {
  bankCardPro: 0,
  bankCardNo:
    '6DD5F3BA00BB90011A6DB4E21FB27AC6C2B8EA8FB3270368C1702F7C7ACEBC27DD53D7EA90B67984BD0136B27941B31038C67F4F60420749521261F9AEF045DEF3A0AC49541132322EFB1F79050F8AF32CF001D35BDDC27637CB45272E2BA893EA1F69DAAF982D0B7C008EEF5D589C594A87A164A383F6ED115BB4502FF62CE7',
  city: '',
  unionBank: '',
  cardType: 1,
  bankName: '工商银行',
  bankCityNo: '',
  bindState: 1,
  province: '',
  bindTime: '2020-05-28 12:04:14',
  phone: '',
  bindMethod: 0,
  branchBankName: '',
  isSafeCard: false,
}

const cardBinInfo = {
  bankCode: '01030000',
  cardBin: '622848',
  cardName: '金穗通宝卡(银联卡)',
  cardType: 1,
  bankName: '农业银行',
  cardState: 1,
  cardLenth: 19,
  cardTypeLabel: '借记卡',
}

const inExpDetail = {
  changeTime: '2020-05-29 16:27:22',
  oriAmount: 0,
  tradeNo: '200000027197411000000',
  curFreezenAmount: 0,
  accountSetName: '上海分公司测试应用-托管账户集',
  chgAmount: 2,
  type: '平台转账',
  curAmount: 2,
  bizOrderNo: 'transfer244d9f72a916eee6d0',
}

export namespace AllinPay {
  export type Config = typeof config

  export interface SetCompanyBasicInfo {
    companyName: string
    authType: 2
    uniCredit: string
    identityType: 1
    legalName: string
    legalIds: string
    legalPhone: string
    accountNo: string
    parentBankName: string
    bankName: string
    unionBank: string
  }

  export interface UpdateCompanyBasicInfo {
    companyName?: string
    legalName?: string
    legalIds?: string
    legalPhone?: string
  }

  export interface OrderDetail {
    buyerBizUserId: string
    amount: number
    orderNo: string
    chnltrxid?: string
    errorMessage?: string
    orderStatus: number
    payDatetime: string
    bizOrderNo: string
  }

  export interface PaymentInformationDetail {
    collOrderNo: string
    collAmount: number
    payerName: string
    payerId: string
    collTime: string
    payTotalAmount: number
    unPayTotalAmount: number
    receiverInfoList?: Array<{ receiverId: string; receiverName: string; managedCollAmount: number; payAmount: number; unPayAmount: number; status: number }>
  }

  // 2企业会员 3个人会员
  export type MemberType = 2 | 3

  export type MemberInfo = typeof memberInfo
  export type BankCardInfo = typeof bankCardInfo
  export type CardBinInfo = typeof cardBinInfo
  export type InExpDetail = typeof inExpDetail

  export interface SplitRuleItem {
    bizUserId: string
    amount: number
    fee: number
  }

  export interface RecieverListItem {
    bizUserId: string
    amount: number
  }

  interface CollectPayListItem {
    bizOrderNo: string
    amount: number
  }

  export interface BatchPayListItem {
    bizOrderNo: string
    collectPayList: CollectPayListItem[]
    bizUserId: string
    amount: number
    fee: number
    splitRuleList?: SplitRuleItem[]
  }

  export interface OrderRefundListItem {
    splitBizOrderNo: string
    amount: number
    bizUserId: string
    splitRefundList: Array<{ bizUserId: string; amount: number; feeAmount: number; accountSetNo?: string }>
    totalSplitAmount?: number
    totalSplitfeeAmount?: number
  }
}

export namespace AllinPaySyb {
  export interface Config {
    endpoint: string;
    appId: string;
    orgId: string;
    cusId: string;
    sybPrivateKey: Buffer;
    sybPublicKey: Buffer;
  }
}
