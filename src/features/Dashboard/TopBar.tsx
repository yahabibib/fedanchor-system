import React from 'react';
import { RadarChartOutlined } from '@ant-design/icons';

const TopBar: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '50%', // 居中核心代码
        transform: 'translateX(-50%)', // 居中核心代码
        zIndex: 1000,
        
        // 视觉样式
        background: 'rgba(15, 23, 42, 0.85)', // 深色磨砂
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '30px', // 圆角大一点，像胶囊
        padding: '10px 40px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        
        // Flex 布局
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        color: '#fff',
        whiteSpace: 'nowrap' // 防止文字换行
      }}
    >
      <RadarChartOutlined style={{ fontSize: '24px', color: '#00f0ff' }} />
      <div>
        <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '2px' }}>
          FED<span style={{ color: '#00f0ff' }}>ANCHOR</span>
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginTop: '-2px' }}>
          GLOBAL OCEAN LAW SYSTEM
        </div>
      </div>
    </div>
  );
};

export default TopBar;