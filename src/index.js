import { initHelia } from './helia.js'
import { Buffer } from 'buffer'
import * as Block from 'multiformats/block'
import * as dagCbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { multiaddr } from "@multiformats/multiaddr"
import { WebRTC } from '@multiformats/multiaddr-matcher'

const topic = 'test'

const [ helia1, helia2 ] = await Promise.all([initHelia(), initHelia()])

console.log('peers', helia1.libp2p.peerId.toString(), helia2.libp2p.peerId.toString())

helia1.libp2p.addEventListener('peer:connect', event => {
  console.log(helia1.libp2p.peerId.toString(), '(helia1)', 'connected to', event.detail.toString())
})

helia2.libp2p.addEventListener('peer:connect', (event) => {
  console.log(helia2.libp2p.peerId.toString(), '(helia2)', 'connected to', event.detail.toString())
})

helia1.libp2p.addEventListener('peer:disconnect', event => {
  console.log(helia1.libp2p.peerId.toString(), '(helia1)', 'disconnected from', event.detail.toString())
})

helia2.libp2p.addEventListener('peer:disconnect', (event) => {
  console.log(helia2.libp2p.peerId.toString(), '(helia2)', 'disconnected from', event.detail.toString())    
})

helia1.libp2p.services.pubsub.addEventListener("message", evt => {
  console.log(`helia received: ${uint8ArrayToString(evt.detail.data)} on topic ${evt.detail.topic}`)
})

helia2.libp2p.services.pubsub.addEventListener("message", (evt) => {
  console.log(`helia2 received: ${uint8ArrayToString(evt.detail.data)} on topic ${evt.detail.topic}`)
})

await helia1.libp2p.services.pubsub.subscribe(topic)
await helia2.libp2p.services.pubsub.subscribe(topic)

console.log('dialling relay')

// replace this with any address configured for circuit relay.
const relay = '/ip4/127.0.0.1/tcp/12345/ws/p2p/12D3KooWAJjbRkp8FPF5MKgMU53aUTxWkqvDrs4zc1VMbwRwfsbE'

await helia1.libp2p.dial(multiaddr(relay))

console.log('relay dialled')

await new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve()
  }, 1000)
})

console.log('helia2 dialling helia1...', helia1.libp2p.getMultiaddrs())
const a1 = multiaddr(`${relay}/p2p-circuit/webrtc/p2p/${helia1.libp2p.peerId.toString()}`)

await helia2.libp2p.dial(a1)

const publisher = setInterval(() => {
helia1.libp2p.services.pubsub.publish(topic, uint8ArrayFromString('Bird, bird bird, bird is the word!')).catch(err => {
  console.error(err)
})
}, 1000)

const { cid, bytes } = await Block.encode({ value: 'some data', codec: dagCbor, hasher: sha256 })

await helia1.blockstore.put(cid, bytes)

console.log('helia1.get', await helia1.blockstore.get(cid))
console.log('helia2.get', await helia2.blockstore.get(cid))

await new Promise((resolve, reject) => {
  setTimeout(async () => {
    if (publisher) {
      clearInterval(publisher)
    }

    helia1.libp2p.services.pubsub.removeEventListener("message")
    helia2.libp2p.services.pubsub.removeEventListener("message")
    helia1.libp2p.removeEventListener("peer:connect")
    helia2.libp2p.removeEventListener("peer:connect")
    helia1.libp2p.removeEventListener("peer:disconnect")
    helia2.libp2p.removeEventListener("peer:disconnect")

    await helia1.libp2p.services.pubsub.unsubscribe(topic)
    await helia2.libp2p.services.pubsub.unsubscribe(topic)

    await helia1.stop()
    console.log(helia1.libp2p.isStarted())
    await helia2.stop()
    console.log(helia2.libp2p.isStarted())
    resolve()
  }, 10000)
})
