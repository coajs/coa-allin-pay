import { die } from 'coa-error'
import { $, _, axios, dayjs } from 'coa-helper'
import { constants, createHash, createSign, createVerify, privateDecrypt, publicEncrypt } from 'crypto'
import { appendFileSync } from 'fs'
import * as querystring from 'querystring'
import { AllinPay } from '../typings'

const padding = constants.RSA_PKCS1_PADDING

interface Dic<T> {
  [key: string]: T
}

export class AllinPayBin {

  private config: AllinPay.Config

  constructor (config: AllinPay.Config) {
    this.config = config
  }

  // 发送service_soa请求
  async service_soa (service: string, method: string, param: Dic<any>) {

    // 组装参数并请求
    const params = await this.getParams({ service, method, param })

    const res = await axios.get(this.config.endpoint + '/service/soa', { params })

    this.devLogRequest(params, res.data)

    // 处理结果
    return this.handleResult(res)
  }

  // 发送允许部分异常的service_soa请求
  async service_soa_allow (service: string, method: string, param: Dic<any>, allow: string, data: object = {}) {
    // 处理异常结果
    return await this.service_soa(service, method, param).catch(e => {
      if (e.mark !== allow)
        throw e
      return _.assign(param, data, { allow })
    })
  }

  // 获取gateway_url
  async gateway_url (url: string, service: string, method: string, param: Dic<any>) {
    // 组装参数并返回
    const params = await this.getParams({ service, method, param })
    return this.config.endpoint + url + '?' + querystring.stringify(params)
  }

  // 加密字段中信息
  public param_encrypt<T extends Dic<any>> (param: T, fields: (keyof T)[]) {
    fields.forEach(k => {
      const value = _.get(param, k)
      if (value) _.set(param, k, this.rsa_encrypt(value))
    })
  }

  // 解密字段中信息
  public param_decrypt<T extends Dic<string>> (param: T, fields: (keyof T)[]) {
    if (param.allow)
      return
    fields.forEach(k => {
      const value = _.get(param, k)
      if (value) _.set(param, k, this.rsa_decrypt(value))
    })
  }

  // 华通银行签名
  public bank_signer (PAYEE_ACCT_NO: string, PAYEE_ACCT_NAME: string, AMOUNT: string, SUMMARY: string = '') {
    const str = JSON.stringify({ AMOUNT, PAYEE_ACCT_NAME, PAYEE_ACCT_NO, SUMMARY })
    return createSign('rsa-sha1').update(str, 'utf8').sign(this.config.bankPrivateKey, 'base64')
  }

  // 获取校验后的数据 rps
  public getVerifyData (result: Dic<any>) {

    // 校验签名
    const md5_str = createHash('md5').update(result.sysid + result.rps + result.timestamp).digest('base64')
    const verify = createVerify('rsa-sha1').update(md5_str, 'utf8').verify(this.config.allinPublicKey, result.sign, 'base64')
    verify || die.hint('支付系统:返回结果校验失败')

    // 解析结果
    try {
      return JSON.parse(result.rps)
    } catch (e) {
      die.hint('支付系统:返回结果解析失败')
    }
  }

  // 开发环境记录返回日志
  devLogBack (body: any) {
    if (this.config.isProd) return
    const text = dayjs().format('YYYY-MM-DD HH:mm:ss') + '\n'
      + 'body: ' + JSON.stringify(body, undefined, 2) + '\n'
      + '\n'
    const file = 'run-log/allin-' + dayjs().format('YYMMDDHH') + '-back.log'
    appendFileSync(file, text)
  }

  // 开发环境记录请求日志
  devLogRequest (param: any, response: any) {
    if (this.config.isProd) return
    const text = dayjs().format('YYYY-MM-DD HH:mm:ss') + '\n'
      + 'params: ' + JSON.stringify(param, undefined, 2) + '\n'
      + 'params_req: ' + JSON.stringify(JSON.parse(param.req), undefined, 2) + '\n'
      + 'response: ' + JSON.stringify(response, undefined, 2) + '\n'
      + '\n'
    const file = 'run-log/allin-' + dayjs().format('YYMMDDHH') + '-request.log'
    appendFileSync(file, text)
  }

  // 敏感信息加密
  private rsa_encrypt (data: string) {
    const key = this.config.allinPublicKey
    return publicEncrypt({ key, padding }, Buffer.from(data)).toString('hex').toUpperCase()
  }

  // 敏感信息解密
  private rsa_decrypt (hexStr: string) {
    const key = this.config.privateKey
    return privateDecrypt({ key, padding }, Buffer.from(hexStr, 'hex')).toString()
  }

  // 结果验签
  private handleResult (res: any) {

    const data = res.data || {}
    // console.log('res.data %j', data)

    // 判断结果是否正确
    if (data.status !== 'OK') {
      die.hint('支付系统提示:' + data.message, 400, data.errorCode)
    }

    // 校验签名
    const md5_str = createHash('md5').update(data.signedValue).digest('base64')
    const verify = createVerify('rsa-sha1').update(md5_str, 'utf8').verify(this.config.allinPublicKey, data.sign, 'base64')
    verify || die.hint('支付系统:返回结果校验失败')

    // 解析结果
    try {
      return JSON.parse(data.signedValue)
    } catch (e) {
      die.hint('支付系统:返回结果解析失败')
    }
  }

  // 请求参数
  private getParams (request: Dic<any>) {

    const sysid = this.config.sysId
    const v = '2.0'
    const req = JSON.stringify(request)
    const timestamp = $.datetime()

    // 计算签名
    const source_str = `${sysid}${req}${timestamp}`
    const md5_str = createHash('md5').update(source_str).digest('base64')
    const sign = createSign('rsa-sha1').update(md5_str, 'utf8').sign(this.config.privateKey, 'base64')

    return { sysid, v, timestamp, sign, req }
  }

}