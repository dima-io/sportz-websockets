import { WebSocketServer, WebSocket } from "ws";
import { wsArcjet } from "../arcject.js";




const matchSubscribes = new Map();

function subscribe(matchId, socket) {
    if (!matchSubscribes.has(matchId)) {
        matchSubscribes.set(matchId, new Set())
    }

    matchSubscribes.get(matchId).add(socket)
}

function unsubscribe(matchId, socket) {
    const subscribers = matchSubscribes.get(matchId);

    if (!subscribers) return;

    subscribers.delete(socket);

    if (subscribers.size === 0)  {
        matchSubscribes.delete(matchId)
    }
}

function cleanupSubscriptions(socket) {
    for(const matchId of socket.subscriptions) {
        unsubscribe(matchId, socket)
    }
}

function broadcastToMatch(matchId, payload) {
    const subscribers = matchSubscribes.get(matchId);
    if (!subscribers || subscribers.size === 0) return;

    const message = JSON.stringify(payload);

    for(const client of subscribers) {
       if(client.readyState === WebSocket.OPEN) {
        client.send(message)
       }
    }

}

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
}

function broadcastToAll(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;
        client.send(JSON.stringify(payload));
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({ server, path: '/ws', payload: 1024 * 1024 });

    wss.on('connection', async (socket, req) => {

        socket.subscriptions = new Set();

        if(wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);
    
                if(decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;
                    const reason = decision.reason.isRateLimit() ? 'Rate limit exceeded' : 'Access denied';
    
                    socket.close(code, reason);
                    return;
                }
    
            } catch (e) {
                console.error('WS connection error', e);
                socket.close(1011, 'Server security error');
                return;
            }
        }

        sendJson(socket, { type: 'welcome' });

        socket.on("message", (data) => {
            handleError(socket, data)
        });

        socket.on('error', () => {
            socket.terminate();
        });

        socket.on("close", () => {
            cleanupSubscriptions(socket);
        })
    });

    function broadcastMatchCreated(match) {
        broadcastToAll(wss, { type: 'match_created', data: match });
    }

    function broadcastCommentary(matchId, comment) {
        broadcastToMatch(matchId, { type: 'commentary', data: comment });
    }

    return { broadcastMatchCreated, broadcastCommentary};
}

function handleError(socket, data) {
    let message;

    try {
        message = JSON.parse(data.toString());
    } catch(e) {
        sendJson(socket, {type: 'error', message: "Invalid JSON"})
    }

    if(message?.type === "subscribe" && typeof message.matchId === "string" && message.matchId.length > 0) {
        subscribe(message.matchId, socket);
        socket.subscriptions.add(message.matchId)
        sendJson(socket, {type: 'subscribed', message: message.matchId});
        return;
    }

    if (message?.type === "unsubscribe" && typeof message.matchId === "string" && message.matchId.length > 0) {
        unsubscribe(message.matchId, socket);
        socket.subscriptions?.delete(message.matchId);
        sendJson(socket, { type: 'unsubscribed', matchId: message.matchId });
    }
}