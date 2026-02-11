import React from 'react';
import OceanMap from './features/Map/OceanMap';
import RightPanel from './features/Dashboard/RightPanel';
import './App.css'; 

// 确保引入 antd 样式 (如果是 v5 则不需要，v4 需要 import 'antd/dist/antd.css')
// import 'antd/dist/reset.css'; // 如果是 Antd v5

const App: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 1. 底层：地图 */}
      <OceanMap />
    </div>
  );
};

export default App;