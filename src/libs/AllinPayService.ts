import { AllinPay } from '../typings'
import { AllinPayBin } from './AllinPayBin'

export class AllinPayService {

  protected bin: AllinPayBin
  protected config: AllinPay.Config

  constructor (bin: AllinPayBin) {
    this.bin = bin
    this.config = this.bin.config
  }

}