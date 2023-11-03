import { strictEqual } from 'assert'
import { initHelia } from '../src/helia.js'
import { Buffer } from 'buffer'
import * as Block from 'multiformats/block'
import * as dagCbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { multiaddr } from "@multiformats/multiaddr"

describe('Test', () => {
  it('run 1', async () => {
      const topic = 'test'
      
      let dialled = false

      const [ helia1, helia2 ] = await Promise.all([initHelia(), initHelia()])

      helia1.libp2p.services.pubsub.addEventListener("message", (evt) => {
        console.log(`helia1 received: ${uint8ArrayToString(evt.detail.data)} on topic ${evt.detail.topic}`)
      })

      helia2.libp2p.services.pubsub.addEventListener("message", (evt) => {
        console.log(`helia2 received: ${uint8ArrayToString(evt.detail.data)} on topic ${evt.detail.topic}`)
      })

      helia1.libp2p.addEventListener("self:peer:update", async (event) => {
        if (!dialled) {
          await helia2.libp2p.peerStore.save(helia1.libp2p.peerId, { multiaddrs: helia1.libp2p.getMultiaddrs() })
          console.log('saved')
          console.log('dialling', helia1.libp2p.peerId)
          await helia2.libp2p.dial(helia1.libp2p.peerId)
          console.log('dialled')
          dialled = true
        }
      })

      await helia1.libp2p.services.pubsub.subscribe(topic)
      await helia2.libp2p.services.pubsub.subscribe(topic)

      console.log('dialling relay')
      await helia1.libp2p.dial(multiaddr('/ip4/127.0.0.1/tcp/12345/ws/p2p/QmQ2zigjQikYnyYUSXZydNXrDRhBut2mubwJBaLXobMt3A'))
      console.log('relay dialled')

      console.log('timeout start')
      await new Promise((resolve, reject) => {
        setTimeout(() => resolve(), 3000)
      })
      console.log('timeout end')

      const interval = setInterval(() => {
        helia1.libp2p.services.pubsub.publish(topic, uint8ArrayFromString('Bird bird bird, bird is the word!')).catch(err => {
          console.error(err)
        })
      }, 1000)

      const { cid, bytes } = await Block.encode({ value: 'some data', codec: dagCbor, hasher: sha256 })

      await helia1.blockstore.put(cid, bytes)

      console.log('helia1.get', await helia1.blockstore.get(cid))
      console.log('helia2.get', await helia2.blockstore.get(cid))

      await new Promise((resolve, reject) => {
        setTimeout(async () => {
          clearInterval(interval)
          
          await helia1.libp2p.services.pubsub.unsubscribe(topic)
          await helia2.libp2p.services.pubsub.unsubscribe(topic)
          
          await helia1.libp2p.hangUp(helia1.libp2p.peerId)
                    
          helia1.libp2p.stop()
          console.log(helia1.libp2p.isStarted())
          helia2.libp2p.stop()
          console.log(helia2.libp2p.isStarted())
          resolve()
      }, 2000)
    })
  })

  it('run 2', async () => {
      const topic = 'test'
      
      let dialled = false

      const [ helia1, helia2 ] = await Promise.all([initHelia(), initHelia()])

      helia1.libp2p.services.pubsub.addEventListener("message", (evt) => {
        console.log(`helia1 received: ${uint8ArrayToString(evt.detail.data)} on topic ${evt.detail.topic}`)
      })

      helia2.libp2p.services.pubsub.addEventListener("message", (evt) => {
        console.log(`helia2 received: ${uint8ArrayToString(evt.detail.data)} on topic ${evt.detail.topic}`)
      })

      helia1.libp2p.addEventListener("self:peer:update", async (event) => {
        if (!dialled) {
          await helia2.libp2p.peerStore.save(helia1.libp2p.peerId, { multiaddrs: helia1.libp2p.getMultiaddrs() })
          console.log('saved')
          console.log('dialling', helia1.libp2p.peerId)
          await helia2.libp2p.dial(helia1.libp2p.peerId)
          console.log('dialled')
          dialled = true
        }
      })

      await helia1.libp2p.services.pubsub.subscribe(topic)
      await helia2.libp2p.services.pubsub.subscribe(topic)

      console.log('dialling relay')
      await helia1.libp2p.dial(multiaddr('/ip4/127.0.0.1/tcp/12345/ws/p2p/QmQ2zigjQikYnyYUSXZydNXrDRhBut2mubwJBaLXobMt3A'))
      console.log('relay dialled')

      const interval = setInterval(() => {
        helia1.libp2p.services.pubsub.publish(topic, uint8ArrayFromString('Bird bird bird, bird is the word!')).catch(err => {
          console.error(err)
        })
      }, 1000)

      const { cid, bytes } = await Block.encode({ value: 'some data', codec: dagCbor, hasher: sha256 })

      await helia1.blockstore.put(cid, bytes)

      console.log('helia1.get', await helia1.blockstore.get(cid))
      console.log('helia2.get', await helia2.blockstore.get(cid))

      await new Promise((resolve, reject) => {
        setTimeout(async () => {
          clearInterval(interval)
          
          await helia1.libp2p.services.pubsub.unsubscribe(topic)
          await helia2.libp2p.services.pubsub.unsubscribe(topic)
          
          await helia1.libp2p.hangUp(helia1.libp2p.peerId)
                    
          helia1.libp2p.stop()
          console.log(helia1.libp2p.isStarted())
          helia2.libp2p.stop()
          console.log(helia2.libp2p.isStarted())
          resolve()
      }, 2000)
    })
  })
})