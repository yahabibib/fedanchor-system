// 替换文件：src/features/Map/hooks/useLayerManager.ts
import { useEffect } from 'react';
import { Viewer, Cartesian3 } from 'cesium';

export const useLayerManager = (viewer: Viewer | null) => {
  useEffect(() => {
    if (!viewer) return;

    // 设置系统初始宏观视角：俯瞰东南亚与马六甲海峡航运咽喉 (新加坡附近上空)
    // 坐标：经度 103.8, 纬度 1.2, 高度 8000000 米
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(103.8, 1.2, 8000000)
    });

    // 替换掉之前旧系统的日志，换成契合您论文的高级感提示
    console.log("[FedAnchor Engine] 跨国航运合规数字孪生底图已初始化就绪，等待动态空间图层调度...");

  }, [viewer]);
};