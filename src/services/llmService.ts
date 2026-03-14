import { type GeoAnalysisResult } from './geoEngine';

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;
const CHAT_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const EMBEDDING_API_URL = "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding";

export interface LegalAlignment {
  enterpriseRule: { source: string; title: string; clause: string; };
  publicLaw: { source: string; title: string; clause: string; };
  score: number; 
  anchorConcept: string;
}

export interface LegalReport {
  status: 'violation' | 'warning' | 'compliant';
  summary: string;
  riskWarnings: string[];
  alignments: LegalAlignment[]; // [核心修改] 改为数组，支持多条对齐数据
  historicalCases: Array<{
    date: string;
    title: string;
    description: string;
    penalty: string;
  }>;

  // [兼容处理] 为了不破坏原有的 FedAnchorGraph 渲染逻辑，保留兜底字段
  source?: any;
  target?: any;
  similarity?: number;
  cases?: any[];
  // [新增] 专门给图谱组件准备的转换后数据
  graphData?: { nodes: any[]; links: any[] }; 
}

// === 向量计算逻辑 ===
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
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

export const fetchLegalOpinion = async (
  geoResult: GeoAnalysisResult | null,
  targetName: string,
  description: string
): Promise<LegalReport> => {
  
  const locationContext = geoResult 
    ? `该目标位于【${geoResult.countryName}】的【${geoResult.zoneLabel}】内。` 
    : "该目标位于【公海 (High Seas)】区域。";

  // [核心重构] 去除 FedAnchor 字眼，防止幻觉。要求输出数组 alignments。
  const systemPrompt = `
    你是一个高级海事合规审查与双向映射引擎。
    请基于目标海域和船舶行为，生成合规性研判的 JSON 报告。

    【重要要求】：
    1. 必须严格按照 JSON 结构输出。
    2. 请生成 1 到 3 条具体的冲突/映射对齐点，放入 alignments 数组中（例如：燃油超标、AIS关闭等分别作为独立对齐点）。
    3. alignments[i].enterpriseRule 模拟航运企业内部规章（如《绿色航运规章》、《船舶操作手册》）。
    4. alignments[i].publicLaw 引用真实的国际公约（如 UNCLOS, MARPOL）或当地国法规。
    5. alignments[i].anchorConcept 提取一个最核心的“语义锚点”（如“限制含硫量”、“领海无害通过”）。
    6. 绝对不要输出任何 markdown 标记（如 \`\`\`json ），只输出纯 JSON 字符串。
    7. 绝对不要在回答中提及任何特定的算法内部代号。

    输出模板：
    {
      "status": "violation" | "warning" | "compliant",
      "summary": "30字核心结论",
      "riskWarnings": ["风险点1...", "风险点2..."],
      "alignments": [
        {
          "enterpriseRule": { "source": "企业本地沙箱", "title": "《...》", "clause": "..." },
          "publicLaw": { "source": "公共海事节点", "title": "《...》", "clause": "..." },
          "anchorConcept": "..."
        }
      ],
      "historicalCases": [
        { "date": "2024-11-05", "title": "...", "description": "...", "penalty": "..." }
      ]
    }
  `;

  const userPrompt = `目标: ${targetName}\n位置: ${locationContext}\n行为/参数: ${description || "疑似未报备作业"}`;

  let report: Partial<LegalReport>;

  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: "qwen-max",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.2
      })
    });
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    report = JSON.parse(cleanJson);
  } catch (error) {
    console.error("LLM Generation Error:", error);
    throw error;
  }

  // --- [核心] 批量处理 Embedding 计算 ---
  if (report.alignments && Array.isArray(report.alignments)) {
    for (let i = 0; i < report.alignments.length; i++) {
      const align = report.alignments[i];
      let similarityScore = 0.85; // 兜底值
      if (align.enterpriseRule?.clause && align.publicLaw?.clause) {
        try {
          const [vecSource, vecTarget] = await Promise.all([
            fetchEmbedding(align.enterpriseRule.clause),
            fetchEmbedding(align.publicLaw.clause)
          ]);
          if (vecSource.length > 0 && vecTarget.length > 0) {
            similarityScore = cosineSimilarity(vecSource, vecTarget);
          }
        } catch (e) {
          console.warn("Embedding failed for alignment item", i);
        }
      }
      align.score = Number((similarityScore * 100).toFixed(1));
    }
  }

  // --- 数据共享准备：为 FedAnchorGraph 动态生成图谱数据结构 ---
  const nodes: any[] = [{ id: 'target_ship', name: targetName, category: 'Target', symbolSize: 40 }];
  const links: any[] = [];
  
  report.alignments?.forEach((align, idx) => {
    const anchorId = `anchor_${idx}`;
    const entId = `ent_${idx}`;
    const pubId = `pub_${idx}`;

    nodes.push({ id: anchorId, name: align.anchorConcept, category: 'Anchor Concept', symbolSize: 30 });
    nodes.push({ id: entId, name: align.enterpriseRule.title, category: 'Enterprise Rule', symbolSize: 20 });
    nodes.push({ id: pubId, name: align.publicLaw.title, category: 'Public Law', symbolSize: 20 });

    links.push({ source: 'target_ship', target: anchorId, value: '触发' });
    links.push({ source: entId, target: anchorId, value: '本地映射' });
    links.push({ source: pubId, target: anchorId, value: '公域映射' });
    links.push({ source: entId, target: pubId, value: `对齐度 ${align.score}%`, lineStyle: { type: 'dashed', color: '#00f0ff' } });
  });

  report.graphData = { nodes, links }; // 存入 report，供图谱组件直接读取

  // 保留老字段防报错
  if (report.alignments && report.alignments.length > 0) {
    report.similarity = report.alignments[0].score / 100;
    report.source = { title: report.alignments[0].enterpriseRule.title, content: report.alignments[0].enterpriseRule.clause };
    report.target = { title: report.alignments[0].publicLaw.title, content: report.alignments[0].publicLaw.clause };
  }
  report.cases = report.historicalCases || [];

  return report as LegalReport;
};