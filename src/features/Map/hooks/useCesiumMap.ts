import { useEffect, useRef, useState } from 'react';
import { 
  Viewer, 
  Ion, 
  Cartesian3, 
  Color,
  ArcGisMapServerImageryProvider // 1. [新增] 引入 ArcGIS 影像服务提供者
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const CESIUM_TOKEN = import.meta.env.VITE_CESIUM_TOKEN;
if (CESIUM_TOKEN) Ion.defaultAccessToken = CESIUM_TOKEN;

export const useCesiumMap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current || viewer) return;

    console.log("🌊 Hook: 初始化地图基础设施...");

    // 1. 初始化 Viewer
    const newViewer = new Viewer(containerRef.current, {
      imageryProvider: undefined, 
      
      // UI 净化
      animation: false,
      timeline: false,
      homeButton: false,
      navigationHelpButton: false,
      baseLayerPicker: false, 
      sceneModePicker: false,
      geocoder: false,
      fullscreenButton: false,
      selectionIndicator: false,
      infoBox: false,
      
      // 渲染优化
      requestRenderMode: true, 
      maximumRenderTimeChange: Infinity,
      contextOptions: { webgl: { alpha: false } }
    });

    // 2. --- 核心修复：加载 ESRI 全球海洋水深图 ---
    // 由于新版 Cesium 推荐使用异步的 fromUrl 方法加载 ArcGIS 服务，我们在此定义一个 async 函数
    const loadOceanBasemap = async () => {
      try {
        newViewer.imageryLayers.removeAll();

        // 请求 ESRI Ocean Basemap 服务
        const oceanProvider = await ArcGisMapServerImageryProvider.fromUrl(
          'https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer'
        );

        newViewer.imageryLayers.addImageryProvider(oceanProvider);
        console.log("✅ ESRI 海洋底图加载成功");
        
        // 底图加载后强制渲染一次，避免黑屏
        newViewer.scene.requestRender();
      } catch (e) {
        console.error("❌ ESRI 海洋底图加载失败:", e);
      }
    };
    
    // 执行底图加载
    loadOceanBasemap();

    // 3. 场景美化 (适配海洋主题)
    const scene = newViewer.scene;
    scene.sun.show = false;
    scene.moon.show = false;
    scene.skyBox.show = false;
    
    // [调整] 将原本的 #0b1018 调整为偏海蓝的深色，与水深图边缘更好地融合
    scene.backgroundColor = Color.fromCssColorString("#0A192F"); 
    
    scene.fog.enabled = true;
    scene.fog.density = 0.0003;
    scene.skyAtmosphere.show = true;
    scene.globe.depthTestAgainstTerrain = false; // 水深图不需要开启地形深度测试，设为 false 防止图层遮挡问题
    
    // [调整] 球体基础颜色也改为深海蓝
    scene.globe.baseColor = Color.fromCssColorString("#0A192F");

    // 4. 初始视角
    newViewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(124.0, 26.0, 8000000),
      orientation: {
        heading: 0.0,
        pitch: -Math.PI / 2,
        roll: 0.0
      },
      duration: 2 
    });
    
    scene.requestRender();
    setViewer(newViewer);

    return () => {
      console.log("🛑 Hook: 销毁地图实例");
      newViewer.destroy();
      setViewer(null);
    };
  }, []); 

  return { containerRef, viewer };
};