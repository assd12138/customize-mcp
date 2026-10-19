import { timingSafeEqual } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";
import env from "./env";
import { createMcp } from "./mcp";

const key = env.customizeKey;

if (!key) {
	throw new Error("Missing customizeKey");
}

const expectedToken = Buffer.from(key);

// 验证 Bearer Token
function verifyToken(token: string): boolean {
	const providedToken = Buffer.from(token);

	return (
		providedToken.length === expectedToken.length &&
		timingSafeEqual(providedToken, expectedToken)
	);
}

function main() {
	const handler = createMcp();

	// 1. 创建 Express 服务
	const app = createMcpExpressApp({
		allowedHosts: env.allowedHosts,
		allowedOrigins: env.allowedHosts,
	});

	const nodeHandler = toNodeHandler(handler);

	// 2. MCP 鉴权中间件
	app.use("/mcp", (req, res, next) => {
		const authorization = req.headers.authorization;

		const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

		if (!token || !verifyToken(token)) {
			res.setHeader("WWW-Authenticate", 'Bearer realm="mcp"');

			res.status(401).json({
				error: "Unauthorized",
				message: "Invalid or missing API key",
			});

			return;
		}

		next();
	});

	// 3. 注册 MCP 路由
	app.all("/mcp", (req, res) => {
		void nodeHandler(req, res, req.body);
	});

	// 4. 启动服务
	app.listen(env.listenPort, env.listenAddress, () => {
		console.log(
			`MCP Server running at http://${env.listenAddress}:${env.listenPort}/mcp`,
		);
	});
}

main();
