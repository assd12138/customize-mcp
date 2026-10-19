// mcp服务器的描述
const mcpDescription = `
提供实时互联网搜索、网页正文抓取及其他自定义工具。提供实时互联网搜索、网页正文抓取及其他自定义工具。提供实时互联网搜索、网页正文抓取及其他自定义工具。
`;
// mcp服务器的工具使用指南
const mcpInstructions = `
此MCP 服务器提供实时网络搜索和网页内容获取功能。
可用功能：
search：在公共网络上搜索近期信息、新闻、技术文档和外部事实。
fetch：根据 URL 获取网页的完整内容。
使用指南：
当任务需要来自互联网的当前信息时，可考虑使用 deepseek_search。
当搜索结果包含的信息不足时，使用 deepseek_fetch 获取来源页面。
对于研究类任务，先进行搜索，必要时再获取相关页面。
在呈现检索到的信息时，引用原始来源 URL。
不要编造搜索结果，也不要在未实际检索的情况下声称信息已经核实。
`.trim();

const env = {
	mcpServerName: "customize",
	mcpServerVersion: "1.0.0",
	mcpDescription,
	mcpInstructions,
	customizeKey: "自定义服务秘钥",
	listenAddress: "localhost",
	listenPort: 3000,
	deepseekApiKey: "deepseek搜索服务秘钥",
};

export default env;
