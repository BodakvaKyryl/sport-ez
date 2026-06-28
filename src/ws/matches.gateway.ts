import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { WebSocket, Server as WsServer } from "ws";

import { allowedOrigins } from "../config";
import { Match } from "../db/schema";

type OutgoingMessage =
  | { type: "welcome" }
  | { type: "match_created"; data: Match }
  | { type: "score_updated"; data: Match };

function verifyClient(info: { origin?: string }) {
  return !info.origin || allowedOrigins.includes(info.origin);
}

@WebSocketGateway({ path: "/ws", verifyClient })
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
