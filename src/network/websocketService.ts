// websocketService.ts

class WebSocketService {
    private ws: WebSocket | null = null;
    private retryCount: number = 0;
    private readonly MAX_RETRY_DELAY: number = 30000; // Maximum delay (30 seconds)
    private readonly url: string;
    private messageHandlers: ((message: any) => void)[] = [];

    constructor(url: string) {
      this.url = url;
    }

    public connect(): void {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("Connected to WebSocket server");
        this.retryCount = 0; // Reset retry count on successful connection
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.messageHandlers.forEach((handler) => handler(message));
      };

      this.ws.onclose = () => {
        console.log("Disconnected from WebSocket server. Attempting to reconnect...");
        this.reconnect(); // Trigger reconnection logic
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.ws?.close(); // Close WebSocket on error to trigger reconnection
      };
    }

    public reconnect(): void {
      const retryDelay = Math.min(1000 * 2 ** this.retryCount, this.MAX_RETRY_DELAY); // Exponential delay

      console.log(`Reconnecting in ${retryDelay / 1000} seconds...`);
      setTimeout(() => {
        this.retryCount++;
        this.connect(); // Attempt to reconnect
      }, retryDelay);
    }

    public sendMessage(message: any): void {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        console.warn("WebSocket is not open. Cannot send message.");
      }
    }

    public addMessageHandler(handler: (message: any) => void): void {
      this.messageHandlers.push(handler);
    }

    public removeMessageHandler(handler: (message: any) => void): void {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    }

    public disconnect(): void {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    }
  }

  export default WebSocketService;
