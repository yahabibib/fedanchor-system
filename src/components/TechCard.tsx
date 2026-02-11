import React from 'react';

interface TechCardProps {
  children: React.ReactNode;
  width?: string | number;
  height?: string | number;
  title?: React.ReactNode; // 支持传入标题
  className?: string;
  style?: React.CSSProperties;
}

const TechCard: React.FC<TechCardProps> = ({ 
  children, 
  width = '100%', 
  height = 'auto', 
  title, 
  style 
}) => {
  return (
    <div style={{ 
      position: 'relative', 
      width, 
      height, 
      background: 'rgba(10, 20, 30, 0.75)', // 基础底色
      backdropFilter: 'blur(10px)',         // 毛玻璃
      border: '1px solid rgba(0, 240, 255, 0.15)', // 极淡的边框
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',    // 阴影
      ...style
    }}>
      
      {/* --- 四个角的装饰 (CSS 魔法) --- */}
      {/* 左上 */}
      <div style={{ position: 'absolute', top: -1, left: -1, width: 10, height: 10, borderTop: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff' }} />
      {/* 右上 */}
      <div style={{ position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderTop: '2px solid #00f0ff', borderRight: '2px solid #00f0ff' }} />
      {/* 左下 */}
      <div style={{ position: 'absolute', bottom: -1, left: -1, width: 10, height: 10, borderBottom: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff' }} />
      {/* 右下 */}
      <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderBottom: '2px solid #00f0ff', borderRight: '2px solid #00f0ff' }} />

      {/* --- 可选标题栏 --- */}
      {title && (
        <div style={{
          height: '40px',
          borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
          background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.1) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 15px',
          color: '#00f0ff',
          fontSize: '16px',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          {/* 小方块装饰 */}
          <div style={{ width: '4px', height: '16px', background: '#00f0ff', marginRight: '10px' }} />
          {title}
        </div>
      )}

      {/* --- 内容区域 --- */}
      <div style={{ height: title ? 'calc(100% - 40px)' : '100%', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};

export default TechCard;