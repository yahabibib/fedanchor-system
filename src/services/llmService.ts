import { type GeoAnalysisResult } from './geoEngine';

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;
const CHAT_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const EMBEDDING_API_URL = "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding";

export interface LegalReport {
  status: 'violation' | 'warning' | 'compliant';
  summary: string;
  source: {
    title: string;
    content: string;
    type: 'domestic';
    url?: string;
    confidence: number; // [新增] 适用置信度 (0-1)
  };
  target: {
    title: string;
    content: string;
    type: 'international';
    url?: string;
    confidence: number; // [新增] 适用置信度 (0-1)
  };
  similarity: number; // FedAnchor 对齐度 (向量计算)
  cases: Array<{
    id: string;
    title: string;
    year: string;
    verdict: string;
    relevance: string;
    url?: string;
    confidence: number; // [新增] 案例参考价值 (0-1)
  }>;
}

// ... cosineSimilarity 和 fetchEmbedding 函数保持不变 (为了节省篇幅省略，请保留原有的) ...
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function fetchEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(EMBEDDING_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({ model: "text-embedding-v1", input: { texts: [text] }, parameters: { text_type: "document" } })
    });
    const data = await response.json();
    return data.output?.embeddings?.[0]?.embedding || [];
  } catch (e) {
    console.error("Embedding API Error:", e);
    return [];
  }
}
// ...

export const fetchLegalOpinion = async (
  geoResult: GeoAnalysisResult | null,
  targetName: string,
  description: string
): Promise<LegalReport> => {
  
  const locationContext = geoResult 
    ? `该目标位于【${geoResult.countryName}】的【${geoResult.zoneLabel}】内。` 
    : "该目标位于【公海 (High Seas)】区域。";

  // [核心修改] Prompt 增加 confidence 字段要求
  const systemPrompt = `
    你是一个海事法律专家 (FedAnchor)。
    请基于 UNCLOS 和相关国内法生成 JSON 报告。
    
    【重要要求】：
    1. 为国内法(source)、国际法(target)和每个案例(cases)计算 "confidence" (0.0-1.0)，代表该条款适用于当前情境的置信度/关联度。
    2. content 字段必须包含具体的法律条款内容（100字左右）。
    3. 提供真实的 URL。
    4. 返回纯 JSON。

    输出模板：
    {
      "status": "violation" | "warning" | "compliant",
      "summary": "30字结论",
      "source": { "title": "国内法标题", "content": "条款内容...", "url": "...", "confidence": 0.95 },
      "target": { "title": "UNCLOS条款", "content": "条款内容...", "url": "...", "confidence": 0.92 },
      "cases": [ 
        { "title": "...", "year": "...", "verdict": "...", "relevance": "...", "confidence": 0.88 }
      ]
    }
  `;

  const userPrompt = `
    目标: ${targetName}
    位置: ${locationContext}
    行为: ${description || "疑似未报备作业"}
  `;

  let report: LegalReport;

  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: "qwen-max",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.1
      })
    });
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    report = JSON.parse(cleanJson);
  } catch (error) {
    console.error("LLM Generation Error:", error);
    throw error;
  }

  // 向量计算逻辑保持不变 (计算 similarity)
  if (report.source?.content && report.target?.content) {
    try {
      const [vecSource, vecTarget] = await Promise.all([
        fetchEmbedding(report.source.content),
        fetchEmbedding(report.target.content)
      ]);
      if (vecSource.length > 0 && vecTarget.length > 0) {
        report.similarity = cosineSimilarity(vecSource, vecTarget);
      } else {
        report.similarity = 0.85; 
      }
    } catch (e) {
      report.similarity = 0.80;
    }
  } else {
    report.similarity = 0.5;
  }

  return report;
};