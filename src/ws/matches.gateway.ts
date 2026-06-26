import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { WebSocket, Server as WsServer } from "ws";

import { Match } from "../db/schema";

type OutgoingMessage =
  | { type: "welcome" }
  | { type: "match_created"; data: Match }
  | { type: "score_updated"; data: Match };

@WebSocketGateway({ path: "/ws" })
export class MatchesGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server!: WsServer;

  handleConnection(client: WebSocket) {
    this.send(client, { type: "welcome" });
  }

  broadcastMatchCreated(match: Match) {
    this.broadcast({ type: "match_created", data: match });
  }

  broadcastScoreUpdated(match: Match) {
    this.broadcast({ type: "score_updated", data: match });
  }

  private broadcast(payload: OutgoingMessage) {
    const data = JSON.stringify(payload);
    for (const client of this.server.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    }
  }

  private send(client: WebSocket, payload: OutgoingMessage) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  }
}
