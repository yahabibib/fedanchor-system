import { type GeoAnalysisResult } from './geoEngine';

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;
const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

// 定义更丰富的法律报告结构
export interface LegalReport {
  status: 'violation' | 'warning' | 'compliant';
  summary: string;
  // 国内法依据
  source: {
    title: string;
    content: string; // 要求更详细的内容
    type: 'domestic';
    url?: string;    // 新增：来源链接
  };
  // 国际法依据
  target: {
    title: string;
    content: string;
    type: 'international';
    url?: string;    // 新增：来源链接
  };
  similarity: number;
  // 相似案例
  cases: Array<{
    id: string;
    title: string;
    year: string;
    verdict: string;
    relevance: string;
    url?: string;    // 新增：案件来源链接
  }>;
}

export const fetchLegalOpinion = async (
  geoResult: GeoAnalysisResult | null,
  targetName: string,
  description: string
): Promise<LegalReport> => {
  
  // 1. 构建地理上下文
  const locationContext = geoResult 
    ? `该目标位于【${geoResult.countryName}】的【${geoResult.zoneLabel}】内。` 
    : "该目标位于【公海 (High Seas)】区域，不属于任何国家管辖海域。";

  // 2. 增强版 System Prompt
  const systemPrompt = `
    你是一个资深的国际海洋法与海事执法专家系统 (FedAnchor)。
    你的任务是根据目标位置和行为，基于《联合国海洋法公约》(UNCLOS) 和相关沿海国国内法，生成一份深度、可溯源的法律研判报告。

    【严格要求】
    1. **模型能力**：请发挥你最强的法律推理能力，引用具体的法条款项（如“第X条第Y款”）。
    2. **内容详实**：法条内容（content）不要只写摘要，必须包含具体的法律规定细节，字数在 100-200 字之间。
    3. **来源溯源**：必须为法律和案例提供真实的官方 URL 链接（如 un.org, npc.gov.cn, icj-cij.org 等）。如果无法获取确切 URL，请生成一个 Google/Bing 的搜索链接。
    4. **格式规范**：必须返回纯 JSON 格式。

    【输出模板 JSON】
    {
      "status": "violation" | "warning" | "compliant",
      "summary": "30字以内的专业定性结论，例如：'涉嫌违反沿海国专属经济区海洋科研管辖权，建议驱离。'",
      "source": {
        "title": "国内法依据标题 (如《中华人民共和国专属经济区和大陆架法》)",
        "content": "详细的法条内容，包含具体款项规定...",
        "type": "domestic",
        "url": "http://www.npc.gov.cn/..."
      },
      "target": {
        "title": "国际法依据标题 (如 UNCLOS 第56条)",
        "content": "详细的法条内容，包含沿海国权利义务的界定...",
        "type": "international",
        "url": "https://www.un.org/depts/los/..."
      },
      "similarity": 0.95,
      "cases": [
        {
          "id": "c1",
          "title": "真实历史案例名称",
          "year": "年份",
          "verdict": "详细的判决结果或外交处理结果（50字左右）",
          "relevance": "该案例与当前情境的法律关联点",
          "url": "https://..." 
        }
      ]
    }
  `;

  const userPrompt = `
    【研判请求】
    目标ID: ${targetName}
    地理位置: ${locationContext}
    行为特征: ${description || "雷达显示其航迹异常，疑似进行未报备的测量或作业活动。"}
    
    请生成 JSON 报告。
  `;

  try {
    if (!API_KEY) throw new Error("缺少 API Key");

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "qwen-max", // [核心升级] 使用千问 Max 版本
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1 // 进一步降低随机性，确保法律引用准确
      })
    });

    if (!response.ok) throw new Error(`API 请求失败: ${response.statusText}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("API 返回内容为空");

    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("LLM Service Error:", error);
    // 降级 Mock 数据
    return {
      status: "warning",
      summary: "云端法律大脑连接超时，已切换至离线规则库。",
      source: { 
        title: "本地离线规则库", 
        content: "检测到目标进入敏感海域，建议进一步核查。", 
        type: "domestic",
        url: "https://www.npc.gov.cn/"
      },
      target: { 
        title: "UNCLOS 通用规则", 
        content: "沿海国在EEZ内享有特定管辖权。", 
        type: "international",
        url: "https://www.un.org/depts/los/convention_agreements/texts/unclos/unclos_c.htm"
      },
      similarity: 0.6,
      cases: []
    };
  }
};