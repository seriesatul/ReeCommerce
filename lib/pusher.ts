import Pusher from "pusher";
import { ENV } from "./env";

// This instance allows our Server (Next.js API) to talk to the Pusher WebSocket Engine
export const pusherServer = new Pusher({
  appId: ENV.PUSHER_APP_ID,
  key: ENV.NEXT_PUBLIC_PUSHER_KEY,
  secret: ENV.PUSHER_SECRET,
  cluster: ENV.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});