import { Response } from "express";

class LikesSSEBroadcaster {
    private clients = new Map<number, Set<Response>>();

    subscribe(postId: number, res: Response): void {
        if (!this.clients.has(postId)) this.clients.set(postId, new Set());
        this.clients.get(postId)!.add(res);
        res.on("close", () => this.unsubscribe(postId, res));
    }

    unsubscribe(postId: number, res: Response): void {
        this.clients.get(postId)?.delete(res);
    }

    broadcast(postId: number, likesCount: number): void {
        const clients = this.clients.get(postId);
        if (!clients) return;
        const data = `data: ${JSON.stringify({ postId, likesCount })}\n\n`;
        for (const res of clients) {
            try { res.write(data); } catch { this.unsubscribe(postId, res); }
        }
    }
}

export const likesSSE = new LikesSSEBroadcaster();
