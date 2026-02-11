import { create } from 'zustand';
import type { GeoAnalysisResult } from '../services/geoEngine'; 
import { GeoEngine } from '../services/geoEngine';
import { fetchLegalOpinion, type LegalReport } from '../services/llmService';

interface SystemState {
  selectedTargetId: string | null;
  analysisStatus: 'idle' | 'analyzing' | 'done';
  
  geoResult: GeoAnalysisResult | null;
  alignmentResult: LegalReport | null;

  // [新增] 缓存池：Key是目标ID，Value是法律报告
  analysisCache: Record<string, LegalReport>;

  // Actions
  setSelectedTarget: (id: string | null) => void;
  startAnalysis: (lon: number, lat: number, desc?: string) => Promise<void>;
  resetAnalysis: () => void;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  selectedTargetId: null,
  analysisStatus: 'idle',
  geoResult: null,
  alignmentResult: null,
  
  // 初始化空缓存
  analysisCache: {},

  setSelectedTarget: (id) => set({ selectedTargetId: id }),
  
  startAnalysis: async (lon: number, lat: number, desc: string = "") => {
    const { selectedTargetId, analysisCache } = get();
    const targetId = selectedTargetId || "temp_target";

    // --- 1. 缓存命中检查 (Cache Hit) ---
    if (analysisCache[targetId]) {
      console.log(`[Store] ⚡ 命中缓存，跳过 API 调用: ${targetId}`);
      set({ 
        analysisStatus: 'done', 
        alignmentResult: analysisCache[targetId],
        // 如果需要，这里也可以把 geoResult 缓存起来，但为了简单，重新算一下 GIS 也没关系(GIS很快)
        // 为了体验一致性，我们还是算一下 GIS
      });
      // 依然快速跑一下 GIS 以便更新地理描述（万一缓存逻辑需要优化），或者直接跳过
      const geoRes = await GeoEngine.analyzePosition(lon, lat);
      set({ geoResult: geoRes });
      return; 
    }

    // --- 2. 缓存未命中 (Cache Miss) -> 发起请求 ---
    set({ analysisStatus: 'analyzing', geoResult: null, alignmentResult: null });
    
    try {
      // Step 1: GIS 空间计算
      console.log(`[Store] 开始 GIS 分析...`);
      const geoRes = await GeoEngine.analyzePosition(lon, lat);
      set({ geoResult: geoRes });
      
      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 2: LLM 法律推理
      console.log(`[Store] 开始 LLM 推理...`);
      const report = await fetchLegalOpinion(geoRes, targetId, desc);
      
      // Step 3: 更新结果 并 写入缓存
      set((state) => ({ 
        analysisStatus: 'done', 
        alignmentResult: report,
        analysisCache: {
          ...state.analysisCache,
          [targetId]: report // [核心] 将结果绑定到该实例ID
        }
      }));

    } catch (error) {
      console.error("全链路分析失败", error);
      set({ analysisStatus: 'idle' });
    }
  },

  resetAnalysis: () => set({ selectedTargetId: null, analysisStatus: 'idle', geoResult: null, alignmentResult: null })
}));