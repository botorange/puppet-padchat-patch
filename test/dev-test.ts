import { Wechaty } from 'wechaty';
import { generate } from 'qrcode-terminal';
import { PuppetPadchat } from 'wechaty-puppet-padchat';

import { PadchatPatch } from '../src'

const token = 'token'
const name = 'test'

const puppet = new PuppetPadchat({
  token
});

const bot = new Wechaty({
  name,
  puppet
});

bot
.on('scan', (qrcode, status) => {
  generate(qrcode, { small: true })

  const qrcodeImageUrl = [
    'https://api.qrserver.com/v1/create-qr-code/?data=',
    encodeURIComponent(qrcode),
  ].join('')

  console.log(`[${status}] ${qrcodeImageUrl}\nScan QR Code above to log in: `)
})
.on('login', async user => {
  console.log(`Login: ${user}`);
})
.start()

/**
 * Hook the -106 failure status here, try to get auth data from separate server
 */
process.on('unhandledRejection', (error) => {
  const { message } = error
  if (message && message.indexOf('unknown status: -106') !== -1) {
    
    const wxid = (message as string).split(' ').slice(-1)[0]
    const padchatPatch = new PadchatPatch(token, name, wxid)
    padchatPatch
    .on('scan', (qrcode, status) => {
      // You need to let the user scan the qrcode again here
      generate(qrcode, { small: true })

      const qrcodeImageUrl = [
        'https://api.qrserver.com/v1/create-qr-code/?data=',
        encodeURIComponent(qrcode),
      ].join('')
      console.log(`[${status}] ${qrcodeImageUrl}\nScan QR Code above to log in: `)
    })
    .on('finish', async () => {
      // restart your application here
    })
    .start()
    return
  }
})
