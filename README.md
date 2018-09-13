# puppet-padchat-patch

### What's this for
This is a temporary solution for the current `-106` issue which blocks new users to login with `wechaty-puppet-padchat`

### How to use

Please take a look at `/test/dev-test.ts` file for a complete example.

```typescript
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
```

* **Currently you need to restart your application when the auth data get picked, so wechaty could pick up the auth data and use it to login to wechat. `reset` does not work for this case now, if you reset wechaty when the `finish` event emitted, you will still get `-106` error.**


* **Notice that with this sulotion, when the user haven't logged in with wechaty before, there could be 3 times qrcode scan, which is not a great experience, but this is just a temporary solution, we are still working on fixing the issue and make everything back to before. If this solution doesn't work for you, please wait paitiently, we will publish new fix later**
