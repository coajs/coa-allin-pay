import { die } from 'coa-error'
import { axios, _, $, dayjs } from 'coa-helper'
import { secure } from 'coa-secure'
import { createSign, createVerify } from 'crypto'
import * as qs from 'querystring'
import { AllinPaySyb } from '../typings'

interface Dic<T> {
  [key: string]: T
}

export class AllinPaySybBin {
  // 基本配置
  readonly config: AllinPaySyb.Config
  // 触发事件过长的阈值
  protected readonly thresholdTooLong = 2 * 1000

  constructor(config: AllinPaySyb.Config) {
    this.config = config
  }

  // 发送请求
  async request(service: string, method: string, param: Dic<any>) {
    // 组装参数并请求
    const params = await this.getParams(param)

    // 请求并记录开始、结束时间
    const startAt = Date.now()
    const res = await axios.post(this.config.endpoint + `/${service}/${method}`, qs.stringify(params), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    const endAt = Date.now()

    // 触发请求事件
    this.onRequest(params, res.data)
    // 触发请求时间过长事件
    if (endAt - startAt > this.thresholdTooLong) {
      this.onRequestTooLong(params, res.data, { startAt, endAt })
    }

    // 处理结果
    try {
      return this.handleResult(res)
    } catch (e) {
      // 触发请求错误事件
      this.onRequestError(params, res.data, e)
      throw e
    }
  }

  // 推送返回记录
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBackReceive(body: any) {}

  // 请求记录
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRequest(param: any, response: any) {}

  // 请求失败
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRequestError(param: any, response: any, error: any) {}

  // 请求时间过长

  onRequestTooLong(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _param: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _response: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    time: { startAt: number; endAt: number }
  ) {}

  // 结果验签
  private handleResult(res: any) {
    const data = res.data || {}

    // 判断结果是否正确
    if (data.retcode !== 'SUCCESS' || data.retmsg || data.handlestate === '3999') {
      die.hint(`支付系统提示：${data.retmsg || data.handlemsg || ''}`)
    }

    // 校验签名（有签名才校验）
    if (data.sign) {
      const sourceStr = this.getSourceStr(_.omit(data, ['sign']))
      const verify = createVerify('rsa-sha1').update(sourceStr, 'utf8').verify(this.config.sybPublicKey, data.sign, 'base64')
      verify || die.hint('支付系统:返回结果校验失败')
    }

    // 解析结果
    try {
      const res = $.camelCaseKeys(_.omit(data, ['appid', 'cusid', 'randomstr', 'retcode', 'retmsg', 'sign']))

      if (res.records) {
        return $.camelCaseKeys(JSON.parse(secure.base64_decode(res.records)))
      } else if (res.imagebase64) {
        return res.imagebase64
      } else {
        return $.camelCaseKeys(res)
      }
    } catch (e) {
      die.hint('支付系统:返回结果解析失败')
    }
  }

  private getSourceStr(params: Dic<any>) {
    const paramList = _.map(params, (v, k) => `${k}=${ typeof v === 'object' ? JSON.stringify(v) : v }`)
    paramList.sort()
    return _.join(paramList, '&')
  }

  // 请求参数
  private getParams(param: Dic<any>) {
    const appid = this.config.appId
    const orgid = this.config.orgId
    const cusid = this.config.cusId
    const randomstr = dayjs().valueOf().toString()
    const version = '11'
    const signtype = 'RSA'

    const params = { appid, orgid, cusid, randomstr, version, signtype, ..._.pickBy(param, (v) => v !== '') }

    // 计算签名
    const sourceStr = this.getSourceStr(params)
    const sign = createSign('rsa-sha1').update(sourceStr, 'utf8').sign(this.config.sybPrivateKey, 'base64')

    return { ...params, sign }
  }
}
