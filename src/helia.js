import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { identifyService } from 'libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
// import { yamux } from '@chainsafe/libp2p-yamux'
import { mplex } from '@libp2p/mplex'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { webSockets } from '@libp2p/websockets'
import { webRTC } from '@libp2p/webrtc'
import * as filters from '@libp2p/websockets/filters'
import { circuitRelayTransport } from 'libp2p/circuit-relay'
import { MemoryDatastore } from 'datastore-core'
import { MemoryBlockstore } from 'blockstore-core'

const initHelia = async () => {
    const options = {
      addresses: {
        listen: [
          '/webrtc'
        ]
      },
      transports: [
        webSockets({
          filter: filters.all
        }),
        webRTC(),
        circuitRelayTransport({
          discoverRelays: 1,
        }),
      ],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()],
      connectionGater: {
        denyDialMultiaddr: () => {
          return false
        }
      },
      services: {
        identify: identifyService(),
        pubsub: gossipsub({ allowPublishToZeroPeers: true })
      }
    }

    const libp2p = await createLibp2p(options)

    const datastore = new MemoryDatastore()
    const blockstore = new MemoryBlockstore()
    return await createHelia({ blockstore, datastore, libp2p })
}

export { initHelia }