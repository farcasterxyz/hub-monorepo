import "dotenv/config";

export const CHANNEL_TTL = Number(process.env["CHANNEL_TTL"] || "3600");

export const REDIS_URL = process.env["REDIS_URL"] || "redis://localhost:6379";

export const RELAY_SERVER_PORT = Number(process.env["RELAY_SERVER_PORT"] || "8000");
export const RELAY_SERVER_HOST = process.env["RELAY_SERVER_HOST"] || "localhost";
