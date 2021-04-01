import { _ } from 'coa-helper'
import { AllinPayService } from '../libs/AllinPayService'
import { AllinPay } from '../typings'

/**
 * 会员接口
 * 1、该接口用于为业务端各类交易角色创建用户，支持个人会员、企业会员。
 * 2、业务端通过唯一标识（bizUserId）创建会员，接口返回通商云会员唯一标识（userId），两者一一对应，在后 续的接口调用中一般通过业务端唯一标识（bizUserId）来标识用户身份。
 */
export class AllinPayMemberService extends AllinPayService {

  /**
   * 创建会员
   * @param bizUserId 商户系统用户标识 商户系统中唯一编号
   * @param memberType 会员类型 2企业会员 3个人会员
   * @param source 访问终端类型 1Mobile 2PC
   * @param acctOrgType 0-通联 1-华通银行 默认1
   */
  async createMember (bizUserId: string, memberType: AllinPay.MemberType, source: 1 | 2, acctOrgType: number) {
    const param = { bizUserId, memberType, source }
    const result = await this.bin.service_soa_allow('MemberService', 'createMember', param, '30000')
    if (result.allow) {
      const member = await this.getMemberInfo(bizUserId, acctOrgType)
      result.userId = member.memberInfo?.userId || ''
    }
    return result as { bizUserId: string, userId: string }
  }

  /**
   * 创建会员
   * 在业务端用户存在账户安全风险等异常情况，需要限制交易时使用，会员被锁定后将无法创建订单，也不能收款。 除解锁会员之外，其它接口都将返回错误信息“会员已锁定”
   * @param bizUserId 商户系统用户标识 商户系统中唯一编号
   */
  async lockMember (bizUserId: string) {
    const param = { bizUserId }
    const result = await this.bin.service_soa_allow('MemberService', 'lockMember', param, '30022')
    return result as { bizUserId: string }
  }

  /**
   * 解锁会员
   * @param bizUserId 商户系统用户标识 商户系统中唯一编号
   */
  async unlockMember (bizUserId: string) {
    const param = { bizUserId }
    const result = await this.bin.service_soa_allow('MemberService', 'unlockMember', param, '9000')
    return result as { bizUserId: string }
  }

  /**
   * 发送短信验证码
   * 1、绑定手机前调用此接口（verificationCodeType=9），系统将向待绑定手机号码发送动态短信验证码。
   * 2、测试环境下，短信验证码从管理后台中查看，获取后台地址及账号密码请联系通商云业务人员。
   * 3、生产环境下，短信验证码会真实发送到用户待绑定手机，管理后台不允许查看。
   * 4、解绑手机前调用此接口（verificationCodeType=6），系统将向待解绑手机号码发送动态短信验证码。
   * @param bizUserId 商户系统用户标识 商户系统中唯一编号
   * @param phone 手机号
   * @param verificationCodeType 验证码类型 9-绑定手机 6-解绑手机
   */
  async sendVerificationCode (bizUserId: string, phone: string, verificationCodeType: 9 | 6) {
    const param = { bizUserId, phone, verificationCodeType }
    const result = await this.bin.service_soa('MemberService', 'sendVerificationCode', param)
    return result as { bizUserId: string, phone: string }
  }

  /**
   * 绑定手机号
   * 本接口自带验证短信验证码的逻辑，因此调用本接口实现绑定会员手机时，应先调用：发送短信验证码接口（sendVerificationCode），且请求参数验证码类型为“绑定手机”。
   * 1、个人/企业会员绑定手机才能创建订单（托管代付订单除外），如会员未绑定手机但已实名仅可作为消费、分账的收款方，以及托管代收中的目标收款人（recieverList.bizUserId）。
   * 2、个人会员创建会员后即可绑定手机，与是否实名认证无关。
   * 3、企业会员需审核通过后才能绑定手机。
   * @param bizUserId 商户系统用户标识 商户系统中唯一编号
   * @param phone 手机号
   * @param verificationCode 验证码
   */
  async bindPhone (bizUserId: string, phone: string, verificationCode: string) {
    const param = { bizUserId, phone, verificationCode }
    const result = await this.bin.service_soa_allow('MemberService', 'bindPhone', param, '30024')
    return result as { bizUserId: string, phone: string }
  }

  /**
   * 解绑手机（验证原手机短信验证码）
   * 本接口自带验证短信验证码的逻辑，验证需解绑手机号的短信验证码，因此调用本接口前，应先调用发送短信验证码接口（sendVerificationCode），验证码类型新增 6-解绑手机，向原手机号码发送验证码。
   * 解绑手机后，用户无法创建订单。
   * @param bizUserId 商户系统用户标识 商户系统中唯一编号
   * @param phone 手机号
   * @param verificationCode 验证码
   */
  async unbindPhone (bizUserId: string, phone: string, verificationCode: string) {
    const param = { bizUserId, phone, verificationCode }
    const result = await this.bin.service_soa('MemberService', 'unbindPhone', param)
    return result as { bizUserId: string, phone: string }
  }

  /**
   * 会员绑定支付账户用户标识 (微信小程序)
   * （1）适用个人会员注册后，无法绑定手机号的业务场景使用，通过此接口绑定支付账户用户标识后，可进 行订单操作，仅限于不使用余额功能的平台使用。
   * （2）一个会员可绑定多个支付账户用户标识，调多次接口；
   * （3）会员进行微信公众号支付、微信小程序支付、支付宝生活号支付、银联 JS 支付时，支付方式中的“acct” 需与会员绑定的“acct”一致；
   * （4）会员如需使用通商云短信验证交易，需通过通商云验证短信验证码更新手机号【修改绑定手机（短信 验证码确认）】、【修改绑定手机（密码验证版）】，字段“oldPhone 原手机”赋值：88888888888
   * （5）未通过【绑定手机】接口进行过手机号绑定的会员，【设置支付密码（密码验证版）】【重置支付密 码（密码验证版）】字段“Phone 原手机”赋值：88888888888
   * @param bizUserId 商户系统用户标识 商户系统中唯一编号
   * @param acct 支付账户用户标识，微信小程序支付填openid
   * acctType 支付账户类型，weChatMiniProgram-微信小程序
   */
  async applyBindAcctWxa (bizUserId: string, acct: string) {
    const param = { bizUserId, acct, operationType: 'set', acctType: 'weChatMiniProgram' }
    const result = await this.bin.service_soa_allow('MemberService', 'applyBindAcct', param, '9000')
    return result as { bizUserId: string }
  }

  /**
   * 个人实名认证
   * 1、绑定银行卡前需先进行实名认证。
   * 2、个人会员创建会员后即可实名认证，与是否绑定手机无关。
   * 3、实名认证是去公安网验证这个人是真实存在的。
   * @param bizUserId 商户系统用户标识 商户系统中唯一编号
   * @param name 姓名
   * @param identityNo 证件号码，目前只支持身份证
   * @param identityBeginDate 证件有效开始日期
   * @param identityEndDate 证件有效截止日期
   * @param address 地址
   * @param professionNo 职业
   * @param telephone 联系电话
   */
  async setRealName (bizUserId: string, name: string, identityNo: string, identityBeginDate: string, identityEndDate: string, address: string, professionNo: string, telephone: string) {
    const param = { bizUserId, name, identityType: 1, identityNo, identityBeginDate, identityEndDate, address, professionNo, telephone }
    this.bin.param_encrypt(param, ['identityNo'])
    const result = await this.bin.service_soa_allow('MemberService', 'setRealName', param, '30007', { identityNo })
    this.bin.param_decrypt(result, ['identityNo'])
    return result as { bizUserId: string, name: string, identityType: 1, identityNo: string, identityBeginDate: string, identityEndDate: string, address: string, professionNo: string, telephone: string }
  }

  /**
   * 华通会员要素补录
   * 针对华通存管应用，此接口供存量商户补录存量会员缺少的要素
   * 前提条件：个人会员实名/企业会员审核通过
   * 补录成功，后台落地补录时间
   * @param bizUserId 商户系统用户标识 商户系统中唯一编号
   * @param identityBeginDate 证件有效开始日期 格式：9999-12-31 华通银行存管上送
   * @param identityEndDate 证件有效开始日期 格式：9999-12-31 华通银行存管上送
   * @param address 地址 住所地或者工作单位地址：不少于 10 个中文汉字 个人会员上送
   * @param professionNo 职业
   * @param telephone 联系电话
   */
  async setBankInfo (bizUserId: string, identityBeginDate: string, identityEndDate: string, address: string, professionNo: string, telephone: string) {
    const param = { bizUserId, identityBeginDate, identityEndDate, address, professionNo, telephone }
    const result = await this.bin.service_soa('MemberService', 'fillMemberInfoForHT', param)
    return result as { bizUserId: string }
  }

  /**
   * 设置企业信息
   * 企业会员必须审核成功，并且绑定手机后，才能进行订单操作。
   * 企业会员审核认证流程：
   * 1) 发送企业营业执照、开户证明（可选）、法人身份证件正反面扫描件通过 FTP 提供通联，具体 FTP 路径及 账户密码通联将与平台生产参数证书一同提供。（测试环境无需发送）
   * 2) 通商云后台审核（通联分公司运营）。
   * 3) 调用设置企业会员信息后，企业认证需进行线上认证：通商云实时完成企业信息核验，需平台承担企业认证 手续费。通商云实时完成企业信息核验，通过响应及企业信息审核结果通知获取 result-审核结果。
   * 4) 测试环境不支持线上认证，需通过管理后台菜单“企业会员管理”审核。
   * 5) 企业工商要素验证：企业名称，法人姓名，法人证件号、认证类型，统一信用代码，工商注册号，纳税人识。
   * @param bizUserId 商户系统用户标识 商户系统中唯一编号
   * @param companyBasicInfo 企业详细信息
   * @param isAuth 是否进行线上认证
   */
  async setCompanyInfo (bizUserId: string, companyBasicInfo: AllinPay.CompanyBasicInfo, isAuth: boolean = true) {
    this.bin.param_encrypt(companyBasicInfo, ['accountNo', 'legalIds'])
    const param = { bizUserId, companyBasicInfo, isAuth, backUrl: this.config.notify + 'set_company_info' }
    const result = await this.bin.service_soa('MemberService', 'setCompanyInfo', param)
    return result as { bizUserId: string, phone: string, identityType: 1, identityNo: string }
  }

  /**
   * 获取会员信息
   * 该接口支持查询个人会员、企业会员。
   * 针对通联存管使用汇入金或华通存管的客户，可根据上送开户机构类型查询对应会员开通的通联子账号或华通子账号；
   * @param bizUserId 商户系统用户标识 商户系统中唯一编号
   * @param acctOrgType 0-通联 1-华通银行 默认1
   */
  async getMemberInfo (bizUserId: string, acctOrgType: number) {
    const param = { bizUserId, acctOrgType }
    const result = await this.bin.service_soa('MemberService', 'getMemberInfo', param)
    this.bin.param_decrypt(result, ['memberInfo.identityCardNo'])
    return result as { bizUserId: string, memberType: AllinPay.MemberType, memberInfo: AllinPay.MemberInfo }
  }

  /**
   * 查询卡bin
   * 该接口用于绑定银行卡操作中根据用户输入的银行卡卡号查询卡名、卡种类型、开户银行等信息，业务端可根据开户银行名称动态显示银行LOGO；
   * 如果绑定贷记卡的，可根据接口返回的卡类型加载CVV2、有效期等表单元素共用户填写。另外调用绑卡接口时可能还需上送该接口返回的部分信息。
   * 注：测试环境下，只支持 622848、622849 开头的 19 位银行卡（后 13 位可以随便指定）
   * @param cardNo 银行卡号
   */
  async getBankCardBin (cardNo: string) {
    const param = { cardNo }
    this.bin.param_encrypt(param, ['cardNo'])
    const result = await this.bin.service_soa('MemberService', 'getBankCardBin', param,)
    return result as { cardBinInfo: AllinPay.CardBinInfo }
  }

  /**
   * 请求绑定银行卡
   * 接口调用说明：
   * 1.个人用户必须先完成【个人实名认证】才能绑定银行卡，且接口请求参数（姓名和证件号码）必须与实名信息一致，验证与实名信息是同人银行卡，且银行卡真实有效。
   * 2.个人用户默认允许绑定多张银行卡，具体配置信息可与通商云业务人员确认。
   * 4.企业用户最多只允许绑定一张法人的个人银行卡，支持通过【解绑绑定银行卡】接口解绑。
   * 5. 企业用户如需提现到个人银行账户，可调用此接口绑定银行卡。
   * 6. 企业用户绑定个人银行卡前，必须设置企业信息必须审核通过。
   * 绑定银行卡流程及相关接口：
   * 1) 调用请求绑定银行卡接口（applyBindBankCard），此接口会自动发送短信验证码；
   * 2) 调用确认绑定银行卡接口（bindBankCard），通联通账户实名验证（三要素）、通联通账户实名验证(四要素)、银行卡四要素验证（万鉴通，全部银行）无需调用此接口。
   * @param bizUserId 商户系统用户标识，商户系统中唯一编号
   * @param cardNo 银行卡号
   * @param name 姓名
   * @param identityNo 证件号，目前填身份证号
   */
  async applyBindBankCard (bizUserId: string, cardNo: string, name: string, identityNo: string) {
    const param = { bizUserId, cardNo, name, identityNo, cardCheck: 1, identityType: 1 }
    this.bin.param_encrypt(param, ['cardNo', 'identityNo'])
    const result = await this.bin.service_soa_allow('MemberService', 'applyBindBankCard', param, '30017')
    return result as { bizUserId: string, bankName: string, bankCode: string, cardType: 1 | 2 }
  }

  /**
   * 解绑绑定银行卡
   * 1. 如需解绑银行卡，直接调用该接口，无需调用其它接口进行确认。
   * 2. 适用于四要素+短信绑定、实名付绑定、账户实名验证(四要素)、通联通快捷、收银宝快捷、万鉴通四要素 绑定的银行卡。
   * 3. 如果会员账户余额不为零，最后一张银行卡仍可解绑，通商云无限制。
   * 4. 支持解绑个人会员绑定的银行卡和企业会员绑定的法人银行卡。
   * 5. 安全卡不能解绑，如需更换安全卡请联系通商云业务人员通过线下流程进行变更。
   * @param bizUserId 商户系统用户标识，商户系统中唯一编号
   * @param cardNo 银行卡号
   */
  async unbindBankCard (bizUserId: string, cardNo: string) {
    const param = { bizUserId, cardNo }
    this.bin.param_encrypt(param, ['cardNo'])
    const result = await this.bin.service_soa('MemberService', 'unbindBankCard', param)
    this.bin.param_decrypt(result, ['cardNo'])
    return result as { bizUserId: string, cardNo: string }
  }

  /**
   * 查询绑定银行卡
   * 该接口用于查询用户已绑定的某张银行卡，或已绑定的全部银行卡，响应报文支持返回多条记录。
   * @param bizUserId 商户系统用户标识，商户系统中唯一编号
   */
  async queryBankCard (bizUserId: string) {
    const param = { bizUserId }
    const result = await this.bin.service_soa('MemberService', 'queryBankCard', param)
    _.forEach(result.bindCardList, v => this.bin.param_decrypt(v, ['bankCardNo']))
    return result as { bindCardList: AllinPay.BankCardInfo[] }
  }

  /**
   * 会员子账号开通
   * 目前支持两种模式：华通存管银行子账号开通和通联存管通联子账号开通，实现平台大 b、小 b、小 c 指定 账户的汇款充值； 
   * 前提条件：个人会员（创建会员、实名认证、绑定手机号），企业会员（创建会员、设置企业信息-审核通过、绑定手机号）
   * @param bizUserId 商户系统用户标识，商户系统中唯一编号
   */
  async createBankSubAcctNo (bizUserId: string) {
    const acctOrgType = 1
    const param = { bizUserId, accountSetNo: this.config.accountSetNo, acctOrgType }
    const result = await this.bin.service_soa('MemberService', 'createBankSubAcctNo', param)
    if (result.allow) {
      const res = await this.getMemberInfo(bizUserId, acctOrgType)
      result.subAcctNo = res.memberInfo.subAcctNo
    }
    result.acctOrgType = param.acctOrgType
    return result as { subAcctNo: string, bizUserId: string, accountSetNo: string, acctOrgType: number }
  }

  /**
   * 会员电子协议签约：
   * （1） 以前台 H5 页面形式进行请求，为平台端的个人会员及企业会员通过页面方式签订三方协议（会员、平 台、通联）。
   * （2） 签约返回字段"ContractNo 会员电子协议编号"，商户端需保存。
   * （3） 签约成功提供后台异步通知；签约失败，页面提示失败原因，不提供异步通知。
   * （4） 个人会员电子协议签约前须完成实名认证。
   * （5） 企业会员电子协议签约前须完成设置企业信息，且企业信息审核成功。
   * （6） 未签约会员将控制提现功能。
   * （7） 签约请求地址
   * @param bizUserId 商户系统用户标识，商户系统中唯一编号
   * @param jumpUrl 跳转的链接
   */
  async signContractUrl (bizUserId: string, jumpUrl: string) {
    const param = { bizUserId, source: 1, jumpUrl, backUrl: this.config.notify + 'sign_contract' }
    return await this.bin.gateway_url('/yungateway/member/signContract.html', 'MemberService', 'signContract', param)
  }

  /**
   * 华通子账号合规信息维护
   * 针对华通存管的应用，需按照华通合规要求补录会员合规信息，其中：
   *  个人会员：姓名、性别、国籍、职业、住所地或者工作单位地址、联系方式(手机号码)、身份证件或者 身份证明文件的种类、号码、证件有效日期开始、证件有效日期截止、有效期限、身份证正、反影像文 件。
   *  企业会员：企业名称、营业范围、注册地址、控股股东或实际控制人、法人代表姓名、身份证件或者身 份证明文件的种类、号码、证件有效日期开始、证件有效日期截止、有效期限、身份证正、反影像文件、 营业执照、组织机构代码、税务登记证号码、可证明该客户依法设立或者可依法开展经营、社会活动的执照、证件或者文件的名称、号码和有效期限。
   *  平台服务端请求该接口，通商云同步响应报文，平台服务端解析报文中 redirectUrl 华通合规信息地址透 传给平台客户端进行重定向到银行合规信息采集页面；
   * @param bizUserId 商户系统用户标识，商户系统中唯一编号
   * @param subAcctNo 会员子账号
   * @param jumpUrl 签订之后，跳转返回的页面地址
   */
  async getSubAcctNoInfoForHT (bizUserId: string, subAcctNo: string, jumpUrl: string) {
    const param = { bizUserId, subAcctNo, jumpUrl, backUrl: this.config.notify + 'sub_acct_info' }
    const result = await this.bin.service_soa('MemberService', 'getSubAcctNoInfoForHT', param)
    return result as { bizUserId: string, subAcctNo: string, redirectUrl: string }
  }

  /**
   * 会员关联微信子商户信息（服务商）管理
   * 关联会员与微信子商户信息，用于会员收款使用
   * 一个会员（包括平台）只可以绑定微信子商户号
   * 一个微信子商户号可以被多个会员绑定
   * 一个微信服务商商户号可关联多个微信子商户号
   * @param operationType 商户系统用户标识，商户系统中唯一编号
   */
  async wxSubMchtService (operationType: 'query' | 'set' | 'delete',) {
    const param = {
      operationType,
      bizUserId: '#yunBizUserId_B2C#',
      mchtId: this.config.wxIsvMiniPay.mchId,
      appid: this.config.wxIsvMiniPay.appWxaId,
      subMchtId: this.config.wxSubMiniPay.mchId,
      subAppId: this.config.wxSubMiniPay.appWxaId
    }
    const result = await this.bin.service_soa_allow('MemberService', 'wxSubMchtService', param, '9000')
    return result as { bizUserId: string }
  }

}