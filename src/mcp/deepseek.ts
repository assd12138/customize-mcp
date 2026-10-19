import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import env from "@/env";

const apiKey = env.deepseekApiKey;

const BASE_URL = "https://api.deepseek.com/v1/tools";

// ============================================================
// Search Schema
// ============================================================

const searchInputSchema = z.object({
	query: z
		.string()
		.trim()
		.min(1)
		.max(128)
		.describe(
			"网页搜索关键词，支持 site:、-site:、lang:、after:、before: 等搜索语法",
		),

	count: z
		.number()
		.int()
		.min(1)
		.max(50)
		.default(10)
		.describe("返回的搜索结果数量，范围为 1~50，默认 10"),

	ori_question: z
		.string()
		.min(1)
		.max(128)
		.nullable()
		.optional()
		.describe("用户的原始问题，有助于搜索引擎理解搜索意图"),

	localization: z
		.string()
		.optional()
		.describe("用于优先返回本地化搜索结果的 IP 地址"),

	need_content: z
		.boolean()
		.default(false)
		.describe(
			"是否同时返回网页正文。默认 false，仅返回摘要；设置为 true 时返回网页正文",
		),
});

const searchOutputSchema = z.object({
	results: z.array(
		z.object({
			rerank_score: z.number(),
			title: z.string(),
			url: z.string(),
			snippet: z.string(),
			summary: z.string(),
			content: z.string(),
			site_name: z.string().nullable(),
			site_icon: z.string().nullable(),
			date: z.string().nullable(),
			authority: z.number().int(),
		}),
	),
});

// ============================================================
// Fetch Schema
// ============================================================

const fetchInputSchema = z.object({
	url: z
		.string()
		.url()
		.max(8192)
		.refine((value) => {
			const url = new URL(value);

			return (
				["http:", "https:"].includes(url.protocol) &&
				!!url.hostname &&
				!url.username &&
				!url.password
			);
		}, "必须是有效的 HTTP/HTTPS URL，且不能包含用户名或密码")
		.describe("需要抓取的网页 URL，必须是有效的 HTTP/HTTPS 地址"),
});

const fetchOutputSchema = z.object({
	title: z.string(),
	content: z.string(),
});

// ============================================================
// Shared API Request
// ============================================================

async function requestDeepSeek(
	endpoint: "search" | "fetch",
	body: Record<string, unknown>,
): Promise<unknown> {
	const response = await fetch(`${BASE_URL}/${endpoint}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(30000),
	});

	if (!response.ok) {
		throw new Error(`DeepSeek API HTTP ${response.status}`);
	}

	return response.json();
}

// ============================================================
// Error Handler
// ============================================================

function handleError(error: unknown) {
	console.error("[DeepSeek MCP Error]", error);

	// 只向 Agent 返回安全的错误信息，不暴露请求头或 Key
	const message =
		error instanceof Error && /^DeepSeek API HTTP \d{3}$/.test(error.message)
			? error.message
			: "DeepSeek API 请求失败或返回了无效数据";

	return {
		isError: true as const,
		content: [
			{
				type: "text" as const,
				text: message,
			},
		],
	};
}

// ============================================================
// MCP Registration
// ============================================================

function registerDeepSeek(server: McpServer) {
	// ----------------------------------------------------------
	// Search
	// ----------------------------------------------------------

	server.registerTool(
		"search",
		{
			title: "Web Search",
			description:
				"使用 DeepSeek 搜索引擎搜索互联网，获取最新网页信息。" +
				"支持关键词搜索、指定网站、语言过滤、日期过滤等。" +
				"返回搜索结果的标题、URL、摘要、相关性评分和权威性评分。" +
				"适用于实时信息查询、资料检索、新闻搜索和事实核查。",

			inputSchema: searchInputSchema,
			outputSchema: searchOutputSchema,

			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: true,
			},
		},

		async (input) => {
			try {
				const response = await requestDeepSeek("search", input);

				const data = searchOutputSchema.parse(response);

				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(data),
						},
					],
					structuredContent: data,
				};
			} catch (error) {
				return handleError(error);
			}
		},
	);

	// ----------------------------------------------------------
	// Fetch
	// ----------------------------------------------------------

	server.registerTool(
		"fetch",
		{
			title: "Web Fetch",
			description:
				"抓取指定 URL 的网页内容，并将网页转换为 Markdown 文本。" +
				"适用于阅读搜索结果中的完整文章、分析网页内容和提取详细信息。" +
				"当搜索结果的摘要不足以回答问题时，可以调用此工具获取完整正文。",

			inputSchema: fetchInputSchema,
			outputSchema: fetchOutputSchema,

			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: true,
			},
		},

		async ({ url }) => {
			try {
				const response = await requestDeepSeek("fetch", { url });

				const data = fetchOutputSchema.parse(response);

				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(data),
						},
					],
					structuredContent: data,
				};
			} catch (error) {
				return handleError(error);
			}
		},
	);
}

export { registerDeepSeek };
