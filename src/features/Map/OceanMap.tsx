import React, { useState } from 'react';
import { useCesiumMap } from './hooks/useCesiumMap';
import { useLayerManager } from './hooks/useLayerManager';

// 组件
import TechHeader from '../Dashboard/TechHeader';
import TechCard from '../../components/TechCard';
import LayerPanel from '../LayerControl/LayerPanel';
import RightPanel from '../Dashboard/RightPanel';
import CoordinateInput from '../Tools/CoordinateInput';
import MapTools from './MapTools';

const OceanMap: React.FC = () => {
  const { containerRef, viewer } = useCesiumMap();
  useLayerManager(viewer);
  
  // 控制研判输入框的显示
  const [showInput, setShowInput] = useState(false);

  // 定义统一宽度常量
  const LEFT_WIDTH = '340px';

  return (
    <div 
      ref={containerRef} 
      className="ocean-map-container"
      style={{ 
        width: '100vw', 
        height: '100vh', 
        background: '#0b1018', 
        overflow: 'hidden',
        position: 'relative'
      }} 
    >
      {/* 1. Header (Top) */}
      <TechHeader />

      {/* 2. LayerControl (Top-Left) */}
      {/* 限制高度，防止与下方的输入框撞车 */}
      <div style={{ position: 'absolute', top: '100px', left: '20px', width: LEFT_WIDTH, zIndex: 900 }}>
        <TechCard title="资源图层控制" height="auto">
          <div style={{ padding: '10px', maxHeight: '40vh' }}> {/* 限制最大高度 */}
             <LayerPanel viewer={viewer} />
          </div>
        </TechCard>
      </div>

      {/* 3. RightPanel (Right - Full Height Dock) */}
      <RightPanel />

      {/* 4. CoordinateInput (Bottom-Left) */}
      {/* 位置：左下角，向上弹出 */}
      {showInput && (
        <div style={{ 
          position: 'absolute', 
          bottom: '30px',  // 距离底部
          left: '20px',    // 距离左侧
          width: LEFT_WIDTH, 
          zIndex: 910 
        }}>
          {/* 这里我们可以稍微调整 CoordinateInput 的高度，或者让 TechCard 自适应 */}
          <TechCard title="智能研判输入">
             <div style={{ padding: '15px' }}>
                <CoordinateInput viewer={viewer} />
             </div>
          </TechCard>
        </div>
      )}

      {/* 5. MapTools (Bottom-Right) */}
      {/* 传入控制 Input 显示的回调 */}
      <MapTools 
        viewer={viewer} 
        onToggleAnalysis={() => setShowInput(!showInput)}
        isAnalysisOpen={showInput}
      />

    </div>
  );
};

export default OceanMap;