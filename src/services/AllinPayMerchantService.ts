import { $ } from 'coa-helper'
import { AllinPayService } from '../libs/AllinPayService'

/**
 * 其它辅助类接口
 */
export class AllinPayMerchantService extends AllinPayService {
  /**
   * 平台头寸查询
   * 根据平台商户管理模式不同，支持查询通联通头寸和电子账户头寸
   */
  async queryReserveFundBalance() {
    const param = { sysid: this.config.sysId, fundAcctSys: 1 }
    const result = await this.bin.service_soa('MerchantService', 'queryReserveFundBalance', param)
    return $.camelCaseKeys(result) as { accountNo: string; accountName: string; balance: number; defClr: number }
  }

  /**
   * 平台账户集余额查询
   * 支持查询平台在通商云系统中各账户集余额
   */
  async queryMerchantBalance(accountSetNo = this.config.accountSetNo) {
    const param = { accountSetNo }
    const result = await this.bin.service_soa('MerchantService', 'queryMerchantBalance', param)
    return result as { allAmount: number; freezeAmount: number }
  }

  /**
   * 银行存管账户余额查询
   * 支持平台查询在银行端存管账户的余额；
   * 华通存管模式：支持查询平台银行存管账户实时余额；
   * 上海银行和招商银行存管模式（金服宝出金）：支持查询实时余额和指定日期期末余额；
   * @param acctNo 银行账户号
   * @param acctName 银行账户名
   */
  async queryBankBalance(acctNo: string, acctName: string) {
    const param = { acctNo, acctName, acctOrgType: 1 }
    const result = await this.bin.service_soa('MerchantService', 'queryBankBalance', param)
    return result as { balance: number }
  }

  /**
   * 直接查询平台银行存管账户余额查询
   */
  async queryBankBalancePlatform() {
    const { acctNo, acctName } = this.config.bankAcct
    // 如果银行账户不存在，则返回balance为-1
    if (!acctNo) return { balance: -1 }
    const param = { acctNo, acctName, acctOrgType: 1 }
    const result = await this.bin.service_soa('MerchantService', 'queryBankBalance', param)
    return result as { balance: number }
  }

  /**
   * 商户集合对账文件下载
   * 1.接口用于平台通过 http 方式从通商云获取对账文件，供平台进行对账。
   * 2.通商云每天上午 8:00 生成前一天的商户对账文件，建议商户 8:30 之后获取。
   * 注：
   * 1. 对账文件内容：含所有订单及平台转账成功的交易；
   * 2. 对账文件名称格式：应用系统编号_yyyyMMdd_allinpay.txt；
   * @param date 对账文件日期 yyyyMMdd
   * @param fileType 文件类型  1-明细 2-汇总 默认为 1
   */
  async getCheckAccountFile(date: string, fileType: 1 | 2) {
    const param = { date, fileType }
    const result = await this.bin.service_soa('MerchantService', 'getCheckAccountFile', param)
    return result as { url: string }
  }
}
