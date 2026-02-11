import { useEffect } from 'react';
import { Viewer, Cartesian3 } from 'cesium';

// [修改] 不再引入 '../data/mockGeoData'
// import { EEZ_BOUNDARY_GEOJSON, INTRUDER_SHIP } from '../../../data/mockGeoData'; 

export const useLayerManager = (viewer: Viewer | null) => {
  useEffect(() => {
    if (!viewer) return;

    // 这里不再加载写死的 EEZ_BOUNDARY_GEOJSON 和 INTRUDER_SHIP
    // 现在的逻辑是：地图初始化是空的，或者由 LayerPanel 读取真实配置来加载
    
    // 如果你希望初始化时相机有个默认视角，可以在这里设置
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(124.0, 26.0, 3000000)
    });

    console.log("[LayerManager] 基础图层管理器已就绪 (无 Mock 数据)");

  }, [viewer]);
};