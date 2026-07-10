import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket'],
})
export class CommandeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected : ${client.id}`);
  }
  notifyNewOrder(orderData: any) {
    console.log('Notifying new order:');
    this.server.emit('newOrder', {
      message: 'Une nouvelle commande a été passée !',
      data: orderData,
    });
  }
}