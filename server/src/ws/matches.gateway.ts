import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { RawData, WebSocket, Server as WsServer } from "ws";

import { allowedOrigins } from "../config";
import { Commentary, Match } from "../db/schema";

type SubscriberSocket = WebSocket & { subscriptions?: Set<number> };

type OutgoingMessage =
  | { type: "welcome" }
  | { type: "match_created"; data: Match }
  | { type: "score_updated"; matchId: number; data: { homeScore: number; awayScore: number } }
  | { type: "commentary_created"; data: Commentary }
  | { type: "subscribed"; matchId: number }
  | { type: "unsubscribed"; matchId: number };

type IncomingMessage =
  { type: "subscribe"; matchId: number } | { type: "unsubscribe"; matchId: number };

function verifyClient(info: { origin?: string }) {
  return !info.origin || allowedOrigins.includes(info.origin);
}

@WebSocketGateway({ path: "/ws", verifyClient })
export class MatchesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: WsServer;

  private readonly matchSubscribers = new Map<number, Set<SubscriberSocket>>();

  handleConnection(socket: SubscriberSocket) {
    socket.subscriptions = new Set();
    socket.on("message", (data) => this.handleMessage(socket, data));
    this.sendToSocket(socket, { type: "welcome" });
  }

  handleDisconnect(socket: SubscriberSocket) {
    this.cleanupSubscriptions(socket);
  }

  broadcastMatchCreated(match: Match) {
    this.broadcastToAll({ type: "match_created", data: match });
  }

  broadcastScoreUpdated(match: Match) {
    this.broadcastToAll({
      type: "score_updated",
      matchId: match.id,
      data: { homeScore: match.homeScore, awayScore: match.awayScore },
    });
  }

  broadcastCommentary(commentaryEntry: Commentary) {
    this.broadcastToMatch(commentaryEntry.matchId, {
      type: "commentary_created",
      data: commentaryEntry,
    });
  }

  private subscribe(matchId: number, socket: SubscriberSocket) {
    let subscribers = this.matchSubscribers.get(matchId);
    if (!subscribers) {
      subscribers = new Set();
      this.matchSubscribers.set(matchId, subscribers);
    }
    subscribers.add(socket);
    socket.subscriptions?.add(matchId);
  }

  private unsubscribe(matchId: number, socket: SubscriberSocket) {
    const subscribers = this.matchSubscribers.get(matchId);
    if (!subscribers) return;

    subscribers.delete(socket);
    socket.subscriptions?.delete(matchId);

    if (subscribers.size === 0) this.matchSubscribers.delete(matchId);
  }

  private cleanupSubscriptions(socket: SubscriberSocket) {
    for (const matchId of socket.subscriptions ?? []) {
      this.unsubscribe(matchId, socket);
    }
  }

  private handleMessage(socket: SubscriberSocket, data: RawData) {
    let msg: IncomingMessage;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (typeof msg?.matchId !== "number") return;

    if (msg.type === "subscribe") {
      this.subscribe(msg.matchId, socket);
      this.sendToSocket(socket, { type: "subscribed", matchId: msg.matchId });
    } else if (msg.type === "unsubscribe") {
      this.unsubscribe(msg.matchId, socket);
      this.sendToSocket(socket, { type: "unsubscribed", matchId: msg.matchId });
    }
  }

  private broadcastToMatch(matchId: number, payload: OutgoingMessage) {
    const subscribers = this.matchSubscribers.get(matchId);
    if (!subscribers) return;

    const data = JSON.stringify(payload);
    for (const socket of subscribers) {
      if (socket.readyState === WebSocket.OPEN) socket.send(data);
    }
  }

  private broadcastToAll(payload: OutgoingMessage) {
    const data = JSON.stringify(payload);
    for (const socket of this.server.clients) {
      if (socket.readyState === WebSocket.OPEN) socket.send(data);
    }
  }

  private sendToSocket(socket: WebSocket, payload: OutgoingMessage) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }
}
