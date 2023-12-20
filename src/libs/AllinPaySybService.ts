import { AllinPaySyb } from '../typings'
import { AllinPaySybBin } from './AllinPaySybBin'

export class AllinPaySybService {
  protected bin: AllinPaySybBin
  protected config: AllinPaySyb.Config

  constructor(bin: AllinPaySybBin) {
    this.bin = bin
    this.config = this.bin.config
  }
}
