import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import env from "@/env";
import { registerDeepSeek } from "./deepseek";

function createMcp() {
	const handler = createMcpHandler(() => {
		const server = new McpServer(
			{
				name: env.mcpServerName,
				version: env.mcpServerVersion,
				description: env.mcpDescription,
			},
			{
				instructions: env.mcpInstructions,
			},
		);
		// 示例
		// server.registerTool(
		//   "powerAction",
		//   {
		//     description: "Control all of power on or off",
		//     inputSchema: z.object({
		//       device: z
		//         .enum(["light", "fan", "tv"])
		//         .describe("需要控制的电器,light: 灯,fan: 风扇,tv: 电视"),
		//       action: z
		//         .enum(["on", "off"])
		//         .describe("需要执行的操作,on: 开,off: 关"),
		//     }),
		//   },
		//   async ({ device, action }) => {
		//     console.log(`Device: ${device}, Action: ${action}`);
		//     return {
		//       content: [
		//         { type: "text", text: `${device} has been turned ${action}` },
		//       ],
		//     };
		//   },
		// );
		registerDeepSeek(server);

		return server;
	});
	return handler;
}

export { createMcp };
