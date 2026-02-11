import React, { useState, useEffect } from 'react';
import { ClockCircleOutlined, CloudServerOutlined, WifiOutlined } from '@ant-design/icons';

const TechHeader: React.FC = () => {
  const [time, setTime] = useState(new Date());

  // 实时更新时间
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '80px',
      zIndex: 1000,
      pointerEvents: 'none', // 关键：让鼠标能穿透头部空白处操作地图
      display: 'flex',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)', // 顶部阴影防撞色
    }}>
      
      {/* 1. 左侧装饰与信息 */}
      <div style={{ position: 'absolute', top: '15px', left: '20px', display: 'flex', alignItems: 'center' }}>
        <div style={{ 
          height: '40px', 
          borderLeft: '4px solid #00f0ff', 
          paddingLeft: '10px',
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.8)'
        }}>
          <div style={{ fontSize: '12px', letterSpacing: '1px' }}>SYSTEM STATUS</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00f0ff', display: 'flex', gap: '10px' }}>
            <span>ONLINE</span>
            <WifiOutlined style={{ fontSize: '14px' }} spin />
          </div>
        </div>
        {/* 装饰横线 */}
        <div style={{ width: '100px', height: '1px', background: 'linear-gradient(90deg, #00f0ff, transparent)', marginLeft: '20px' }} />
      </div>

      {/* 2. 中间核心标题 (倒梯形结构) */}
      <div style={{
        position: 'relative',
        width: '45%', // 宽度
        height: '60px',
        background: 'rgba(15, 23, 42, 0.85)', // 深蓝底色
        backdropFilter: 'blur(8px)', // 毛玻璃
        borderBottom: '2px solid rgba(0, 240, 255, 0.6)',
        // 核心：切割成倒梯形
        clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // 发光滤镜 (这就很有科技感了)
        filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.3))'
      }}>
        <h1 style={{ 
          margin: 0, 
          color: '#fff', 
          fontSize: '28px', 
          fontWeight: '900', 
          letterSpacing: '6px',
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          textShadow: '0 0 10px rgba(0, 240, 255, 0.5)'
        }}>
          全球海洋法智慧服务系统
        </h1>
        <div style={{ fontSize: '10px', color: '#00f0ff', letterSpacing: '3px', opacity: 0.8, marginTop: '2px' }}>
          GLOBAL OCEAN LAW INTELLIGENT SERVICE SYSTEM
        </div>
        
        {/* 装饰：底部的发光小方块 */}
        <div style={{ position: 'absolute', bottom: '-4px', width: '20px', height: '4px', background: '#00f0ff' }}></div>
      </div>

      {/* 3. 右侧装饰与时间 */}
      <div style={{ position: 'absolute', top: '15px', right: '20px', display: 'flex', alignItems: 'center' }}>
        {/* 装饰横线 */}
        <div style={{ width: '100px', height: '1px', background: 'linear-gradient(-90deg, #00f0ff, transparent)', marginRight: '20px' }} />
        
        <div style={{ 
          height: '40px', 
          borderRight: '4px solid #00f0ff', 
          paddingRight: '10px',
          textAlign: 'right',
          color: 'rgba(255,255,255,0.8)'
        }}>
          <div style={{ fontSize: '12px', letterSpacing: '1px' }}>{time.toLocaleDateString()}</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>
            {time.toLocaleTimeString()} <ClockCircleOutlined style={{ color: '#00f0ff', fontSize: '14px' }} />
          </div>
        </div>
      </div>

      {/* 4. 底部贯穿线 (增加整体感) */}
      <div style={{
        position: 'absolute',
        top: '60px',
        width: '90%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(0,240,255,0.3) 50%, transparent 100%)',
        zIndex: -1
      }} />

    </div>
  );
};

export default TechHeader;