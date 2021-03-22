import { AllinPay } from '../typings'
import { AllinPayBin } from './AllinPayBin'

export class AllinPayService {

  protected bin: AllinPayBin
  protected config: AllinPay.Config

  constructor (config: AllinPay.Config) {
    this.config = config
    this.bin = new AllinPayBin(config)
  }

}