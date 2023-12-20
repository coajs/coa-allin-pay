import { AllinPaySybService } from '../libs/AllinPaySybService'

export class AllinPayComplaintService extends AllinPaySybService {
  /**
   * 微信查询投诉单列表
   * @link https://aipboss.allinpay.com/know/devhelp/main.php?pid=45#mid=1203
   * @param beginDate 开始日期，格式为yyyy-MM-DD。注意，查询日期跨度不超过30天
   * @param endDate 结束日期，格式为yyyy-MM-DD。注意，查询日期跨度不超过30天
   * @param offset 分页大小，可空，默认为0
   * @param limit 分页开始位置，可空，默认为10
   */
  async complaintQry(beginDate: string, endDate: string, offset = 0, limit = 50) {
    return await this.bin.request('riskfeeback', 'complaintqry', {
      begin_date: beginDate,
      end_date: endDate,
      offset,
      limit,
    })
  }

  /**
   * 微信查询投诉单详情
   * @link https://aipboss.allinpay.com/know/devhelp/main.php?pid=45#mid=1204
   * @param complaintId 投诉单号
   */
  async complaintDetail(complaintId: string) {
    return await this.bin.request('riskfeeback', 'wxcomplaintdetail', {
      complaint_id: complaintId,
    })
  }

  /**
   * 微信查询投诉协商历史
   * @link https://aipboss.allinpay.com/know/devhelp/main.php?pid=45#mid=1205
   * @param complaintId 投诉单号
   * @param offset 分页大小，可空，默认为0
   * @param limit 分页开始位置，可空，默认为100
   */
  async complaintHistory(complaintId: string, offset = 0, limit = 100) {
    return await this.bin.request('riskfeeback', 'wxcomplainthistory', {
      complaint_id: complaintId,
      offset,
      limit,
    })
  }

  /**
   * 微信回复用户
   * @link https://aipboss.allinpay.com/know/devhelp/main.php?pid=45#mid=1206
   * @param complaintId 投诉单号
   * @param content 回复内容，不超过200字符
   * @param images 回复图片，多张是以#@#相隔，最多4张
   */
  async complaintResp(complaintId: string, content: string, images = '') {
    return await this.bin.request('riskfeeback', 'complaintsResp', {
      complaint_id: complaintId,
      response_content: content,
      response_images: images,
    })
  }

  /**
   * 微信反馈处理完成
   * @link https://aipboss.allinpay.com/know/devhelp/main.php?pid=45#mid=1207
   * @param complaintId 投诉单号
   */
  async complaintComplete(complaintId: string) {
    return await this.bin.request('riskfeeback', 'complaintsComplete', {
      complaint_id: complaintId,
    })
  }

  /**
   * 微信下载微信图片
   * @link https://aipboss.allinpay.com/know/devhelp/main.php?pid=45#mid=1210
   * @param imgUrl 图片地址
   */
  async getMerchantImage(imgUrl: string) {
    return await this.bin.request('riskfeeback', 'wxgetmerchantimage', {
      imgurl: imgUrl,
    })
  }

}
