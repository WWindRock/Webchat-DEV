import { Server } from 'socket.io'
import { createServer } from 'http'

class WebSocketManager {
  private io: Server | null = null
  private userSockets: Map<string, string[]> = new Map()
  
  initialize(server: ReturnType<typeof createServer>) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })
    
    this.io.on('connection', (socket) => {
      const userId = socket.handshake.auth.userId
      
      if (userId) {
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, [])
        }
        this.userSockets.get(userId)!.push(socket.id)
        
        socket.on('disconnect', () => {
          const sockets = this.userSockets.get(userId) || []
          const index = sockets.indexOf(socket.id)
          if (index > -1) {
            sockets.splice(index, 1)
          }
        })
      }
    })
  }
  
  emitToUser(userId: string, event: any) {
    if (!this.io) return
    
    const socketIds = this.userSockets.get(userId) || []
    socketIds.forEach(socketId => {
      this.io!.to(socketId).emit('message', event)
    })
  }
  
  broadcast(event: any) {
    if (!this.io) return
    this.io.emit('message', event)
  }
}

export const websocketManager = new WebSocketManager()
