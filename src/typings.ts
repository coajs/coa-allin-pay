const config = {
  isProd: false,
  endpoint: '',
  notify: '',
  sysId: '',
  accountSetNo: '',
  wxMiniPay: {
    mchId: '',
    appWxaId: '',
    appWxaName: ''
  },
  wxIsvMiniPay: {
    mchId: '',
    appWxaId: '',
    appWxaName: ''
  },
  wxSubMiniPay: {
    mchId: '',
    appWxaId: '',
    appWxaName: ''
  },
  bankAcct: {
    acctName: '',
    acctNo: '',
  },
  privateKey: {} as Buffer,
  allinPublicKey: {} as Buffer,
  bankPrivateKey: {} as Buffer,
}

const memberInfo = {
  'country': null,
  'subAcctNo': '9120001000436901500',
  'isSignContract': true,
  'contractNo': '1265918142371078100',
  'payFailAmount': 0,
  'remark': null,
  'source': 1,
  'province': null,
  'userState': 1,
  'identityType': 1,
  'ContractNo': '1265918142371078100',
  'identityCardNo': '111',
  'isSetPayPwd': false,
  'acctOrgType': 1,
  'signContractTime': '2020-05-28 16:09:39',
  'area': null,
  'registerIp': null,
  'address': null,
  'registerTime': '2020-05-26 20:16:54',
  'signAgreementNum': '241',
  'isIdentityChecked': true,
  'userId': '004454b0-fc82-4c1e-885c-ea249dc1fbe9',
  'isPhoneChecked': true,
  'realNameTime': '2020-05-28 01:01:32',
  'phone': '15010001001',
  'name': '111'
}

const bankCardInfo = {
  'bankCardPro': 0,
  'bankCardNo': '6DD5F3BA00BB90011A6DB4E21FB27AC6C2B8EA8FB3270368C1702F7C7ACEBC27DD53D7EA90B67984BD0136B27941B31038C67F4F60420749521261F9AEF045DEF3A0AC49541132322EFB1F79050F8AF32CF001D35BDDC27637CB45272E2BA893EA1F69DAAF982D0B7C008EEF5D589C594A87A164A383F6ED115BB4502FF62CE7',
  'city': '',
  'unionBank': '',
  'cardType': 1,
  'bankName': '工商银行',
  'bankCityNo': '',
  'bindState': 1,
  'province': '',
  'bindTime': '2020-05-28 12:04:14',
  'phone': '',
  'bindMethod': 0,
  'branchBankName': '',
  'isSafeCard': false
}

const cardBinInfo = {
  'bankCode': '01030000',
  'cardBin': '622848',
  'cardName': '金穗通宝卡(银联卡)',
  'cardType': 1,
  'bankName': '农业银行',
  'cardState': 1,
  'cardLenth': 19,
  'cardTypeLabel': '借记卡'
}

const orderDetail = {
  'buyerBizUserId': 'payer_id_for_test_aex',
  'amount': 1,
  'orderNo': '1266242455984967680',
  'orderStatus': 4,
  'payDatetime': '2020-05-29 13:44:13',
  'bizOrderNo': 'consume9aa75c5a9a0e555dd0'
}

const inExpDetail = {
  'changeTime': '2020-05-29 16:27:22',
  'oriAmount': 0,
  'tradeNo': '2005291627197411026167',
  'curFreezenAmount': 0,
  'accountSetName': '上海分公司测试应用-托管账户集',
  'chgAmount': 2,
  'type': '平台转账',
  'curAmount': 2,
  'bizOrderNo': 'transfer244d9f72a916eee6d0'
}

export namespace AllinPay {

  export interface CompanyBasicInfo {
    companyName: string,
    authType: 2,
    uniCredit: string,
    legalName: string,
    identityType: 1,
    legalIds: string,
    legalPhone: string,
    accountNo: string,
    parentBankName: string,
    bankName: string,
    unionBank: string
  }

  export type Config = typeof config

  // 2企业会员 3个人会员
  export type MemberType = 2 | 3

  export type MemberInfo = typeof memberInfo
  export type BankCardInfo = typeof bankCardInfo
  export type CardBinInfo = typeof cardBinInfo
  export type OrderDetail = typeof orderDetail
  export type InExpDetail = typeof inExpDetail
}