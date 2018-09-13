import { EventEmitter } from 'events'
import { MemoryCard } from 'memory-card'
import { Gateway } from './gateway'
import log from './config'

const PUPPET_MEMORY_NAME = 'puppet'
const MEMORY_SLOT_NAME = 'WECHATY_PUPPET_PADCHAT'

export interface PadchatMemorySlot {
  device: {
    [userId: string]: undefined | {
      data  : string,
      token : string,
    },
  },
  currentUserId?: string,
}

const PRE = 'PadchatPatch'

export class PadchatPatch extends EventEmitter {
  private token: string
  private name: string
  private wxid: string
  private memory?: MemoryCard
  private gateway: Gateway
  private memorySlot?: PadchatMemorySlot
  private checkTimer?: NodeJS.Timer

  constructor (token: string, name: string, wxid: string) {
    super()
    this.token = token
    this.name = name
    this.wxid = wxid
    this.gateway = new Gateway()
  }

  public async start() {
    log.info(PRE, `start() with token: ${this.token}, name: ${this.name}, wxid: ${this.wxid}`)
    const memory = new MemoryCard(this.name)
    log.silly(PRE, `start() trying to load memory card (${this.name})`)
    await memory.load()
    this.memory = memory.multiplex(PUPPET_MEMORY_NAME)
    let memorySlot = await this.readMemorySlot()
    if (memorySlot && memorySlot.currentUserId === this.wxid && memorySlot.device[this.wxid] && memorySlot.device[this.wxid]!.data) {
      log.info('PadchatPatch', `start() 62 data exists, no need to use padchat patch`)
      return
    } else {
      if (!memorySlot) {
        log.silly(PRE, 'start() no memory card info, creating one')
        memorySlot = {
          device: {}
        }
      }
      
      this.memorySlot = memorySlot

      this.checkTimer = setInterval(() => this.checkData.bind(this)(), 1000)
    }
  }

  private async checkData () {
    log.silly(PRE, `checkData()`)
    const authData = await this.gateway.getAuthData(this.wxid)
    const { qrcodeUrl, status, data } = authData
    switch (status) {
      case 'new':
        this.emit('scan', qrcodeUrl)
        break

      case 'waiting':
        log.silly('PadchatPatch', `waiting for scan`)
        break

      case 'done':
        this.memorySlot!.device[this.wxid] = {
          data: Buffer.from(data!, 'hex').toString('base64'),
          token: ''
        }
        this.memorySlot!.currentUserId = this.wxid
        await this.saveMemorySlot()
        this.emit('finish')
        this.stop()
        break

      default:
        break
    }
  }

  private stop () {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
    }
  }

  private async readMemorySlot (): Promise<PadchatMemorySlot | undefined> {
    log.silly(PRE, `readMemorySlot()`)
    const memorySlot = await this.memory!.get<PadchatMemorySlot>(MEMORY_SLOT_NAME)
    return memorySlot
  }

  private async saveMemorySlot () {
    log.silly(PRE, `saveMemorySlot()`)
    await this.memory!.set(MEMORY_SLOT_NAME, this.memorySlot)
    await this.memory!.save()
  }
}
