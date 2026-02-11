import React, { useState } from 'react';
import { Button, Tooltip, Space } from 'antd';
import { 
  AimOutlined, 
  GatewayOutlined, 
  PictureOutlined,
  CompassOutlined 
} from '@ant-design/icons';
import { 
  Viewer, 
  Cartesian3, 
  UrlTemplateImageryProvider, 
  // [注意] 删掉 ArcGisMapServerImageryProvider，我们不再需要它了
} from 'cesium';

interface MapToolsProps {
  viewer: Viewer | null;
  onToggleAnalysis?: () => void;
  isAnalysisOpen?: boolean;
}

const MapTools: React.FC<MapToolsProps> = ({ 
  viewer, 
  onToggleAnalysis, 
  isAnalysisOpen 
}) => {
  const [is3D, setIs3D] = useState(true);
  const [isSatellite, setIsSatellite] = useState(false);

  // 1. 复位视角
  const handleResetCamera = () => {
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(124.0, 28.0, 2500000), // 高度调到合适位置
      orientation: {
        heading: 0.0,
        pitch: -Math.PI / 2,
        roll: 0.0
      },
      duration: 1.5
    });
  };

  // 2. 2D/3D 切换
  const handleToggleMode = () => {
    if (!viewer) return;
    if (is3D) {
      viewer.scene.morphTo2D(1.0);
    } else {
      viewer.scene.morphTo3D(1.0);
    }
    setIs3D(!is3D);
  };

  // 3. [核心修复] 底图切换
  const handleToggleLayer = () => {
    if (!viewer) return;
    
    // 移除旧图层
    viewer.imageryLayers.removeAll();

    if (!isSatellite) {
      // --- 切换到：高清卫星图 (ESRI World Imagery) ---
      // 使用 UrlTemplateImageryProvider 代替 ArcGisMapServerImageryProvider
      // 这是最稳健的加载方式，绝对不会报错
      const satelliteProvider = new UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
        credit: 'Esri Satellite'
      });
      
      viewer.imageryLayers.addImageryProvider(satelliteProvider);
      
      // 卫星图比较亮，稍微调整大气亮度让它自然点
      viewer.scene.skyAtmosphere.brightnessShift = 0.1;
      
    } else {
      // --- 切换回：暗黑科技底图 (CartoDB Dark) ---
      const darkProvider = new UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        maximumLevel: 19
      });
      
      viewer.imageryLayers.addImageryProvider(darkProvider);
      
      // 暗黑模式需要更深邃的大气
      viewer.scene.skyAtmosphere.brightnessShift = -0.4;
    }
    
    // 强制切回 3D 模式 (通常切换底图后看 3D 效果更好)
    if (!is3D) {
        viewer.scene.morphTo3D(1.0);
        setIs3D(true);
    }
    
    setIsSatellite(!isSatellite);
  };

  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '30px', // 距离底部
        right: '20px',  // 距离右侧 (RightPanel 在它上方)
        zIndex: 900,
        background: 'rgba(10, 20, 30, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        borderRadius: '4px',
        padding: '10px 20px',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}
    >
      <div style={{ width: '2px', height: '20px', background: '#00f0ff', marginRight: '5px' }} />

      <Space size="large">
        <Tooltip title="复位视角">
          <Button 
            type="text" 
            shape="circle" 
            icon={<AimOutlined />} 
            onClick={handleResetCamera}
            style={{ color: '#fff', fontSize: '18px' }}
          />
        </Tooltip>

        <Tooltip title={is3D ? "切换至 2D" : "切换至 3D"}>
          <Button 
            type="text" 
            shape="circle" 
            icon={<GatewayOutlined rotate={is3D ? 0 : 90} />} 
            onClick={handleToggleMode}
            style={{ color: is3D ? '#00f0ff' : '#fff', fontSize: '18px' }}
          />
        </Tooltip>

        <Tooltip title={isSatellite ? "切换至暗黑模式" : "切换至卫星影像"}>
          <Button 
            type="text" 
            shape="circle" 
            icon={<PictureOutlined />} 
            onClick={handleToggleLayer}
            style={{ color: isSatellite ? '#f59e0b' : '#fff', fontSize: '18px' }}
          />
        </Tooltip>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />

        <Tooltip title="打开/关闭 智能研判面板">
          <Button 
            type="text" 
            shape="circle" 
            icon={<CompassOutlined />} 
            onClick={onToggleAnalysis}
            style={{ 
              color: isAnalysisOpen ? '#f59e0b' : '#fff',
              fontSize: '18px',
              border: isAnalysisOpen ? '1px solid #f59e0b' : 'none'
            }}
          />
        </Tooltip>
      </Space>
    </div>
  );
};

export default MapTools;