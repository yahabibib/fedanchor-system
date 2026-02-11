import React, { useEffect, useState } from 'react';
import { Button, Tag, Progress, Card, Divider, Typography, Tooltip, Row, Col } from 'antd';
import { 
  MenuUnfoldOutlined, MenuFoldOutlined, 
  SafetyCertificateOutlined, WarningOutlined, SyncOutlined, 
  FileTextOutlined, BookOutlined, LinkOutlined, GlobalOutlined, BankOutlined,
  RadarChartOutlined, EnvironmentOutlined, ThunderboltOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useSystemStore } from '../../stores/useSystemStore';
import TechCard from '../../components/TechCard';

const { Paragraph } = Typography;

const RightPanel: React.FC = () => {
  const { selectedTargetId, analysisStatus, alignmentResult, geoResult } = useSystemStore();
  
  // 默认收起
  const [collapsed, setCollapsed] = useState(true);

  // 统一宽度 400px
  const PANEL_WIDTH = '400px';

  useEffect(() => {
    if (selectedTargetId) setCollapsed(false);
    else setCollapsed(true);
  }, [selectedTargetId]);

  const RenderSourceHeader = ({ title, url, icon }: { title: string, url?: string, icon: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>{icon} {title}</span>
      {url && <Tooltip title="跳转至官方来源"><a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff' }}><LinkOutlined /></a></Tooltip>}
    </div>
  );

  const renderContent = () => {
    if (!selectedTargetId) {
      return (
        <div style={{ textAlign: 'center', marginTop: '100px', color: '#64748b' }}>
          <SyncOutlined spin style={{ fontSize: '24px', marginBottom: '10px' }} />
          <p>系统在线<br/>请在地图上选择目标以启动分析</p>
        </div>
      );
    }

    if (analysisStatus === 'analyzing') {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3 style={{ color: '#00f0ff', fontFamily: 'Rajdhani' }}>FedAnchor Protocol</h3>
          <div style={{ margin: '30px 0' }}>
            <Progress type="circle" percent={72} status="active" strokeColor={{ '0%': '#108ee9', '100%': '#00f0ff' }} format={() => <span style={{fontSize: '12px', color: '#fff'}}>Aligning</span>} />
          </div>
          <div style={{ textAlign: 'left', fontSize: '12px', color: '#94a3b8', paddingLeft: '40px' }}>
            <p style={{ margin: '5px 0' }}>✔ GIS: 目标空间定位锁定</p>
            <p style={{ margin: '5px 0', color: '#00f0ff' }}><SyncOutlined spin style={{ marginRight: '8px' }} />FedAnchor: 联邦图谱推理中...</p>
            <p style={{ margin: '5px 0' }}>⚡ RAG: 检索全球海事判例库...</p>
          </div>
        </div>
      );
    }

    if (analysisStatus === 'done' && alignmentResult) {
      const statusColor = alignmentResult.status === 'violation' ? '#ef4444' : alignmentResult.status === 'warning' ? '#f59e0b' : '#10b981';
      const StatusIcon = alignmentResult.status === 'violation' ? WarningOutlined : SafetyCertificateOutlined;
      
      // 计算相似度颜色和数值
      const similarityPercent = Math.round(alignmentResult.similarity * 100);
      const similarityColor = similarityPercent > 90 ? '#10b981' : similarityPercent > 70 ? '#108ee9' : '#f59e0b';

      return (
        <div className="fade-in-up">
          {/* 0. 空间定位信息 */}
          <div style={{ 
            background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 0, 0, 0) 100%)', 
            borderLeft: '4px solid #00f0ff',
            padding: '10px 15px',
            marginBottom: '15px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <RadarChartOutlined /> GIS 空间定位
              </span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginTop: '2px', fontFamily: 'Rajdhani' }}>
                {geoResult ? `${geoResult.countryName} · ${geoResult.zoneLabel}` : '公海 (High Seas) · 国际水域'}
              </span>
            </div>
            <EnvironmentOutlined style={{ fontSize: '20px', color: '#00f0ff', opacity: 0.5 }} />
          </div>

          {/* 1. 结果定性 */}
          <div style={{ 
            background: `rgba(${alignmentResult.status === 'violation' ? '220, 38, 38' : '16, 185, 129'}, 0.1)`, 
            border: `1px solid ${statusColor}`, 
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex', alignItems: 'start', gap: '10px'
          }}>
            <StatusIcon style={{ fontSize: '24px', color: statusColor, marginTop: '2px' }} />
            <div>
              <div style={{ color: statusColor, fontWeight: 'bold', fontSize: '16px' }}>
                {alignmentResult.status === 'violation' ? '严重违规' : alignmentResult.status === 'warning' ? '存在疑点' : '合规行为'}
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
                {alignmentResult.summary}
              </div>
            </div>
          </div>

          <Divider orientation="left" style={{ borderColor: '#334155', color: '#94a3b8' }}>FedAnchor 法律对齐</Divider>

          {/* 2. 国内法 (Source) */}
          <Card 
            size="small" 
            title={<RenderSourceHeader title="国内法依据 (Source)" url={alignmentResult.source.url} icon={<BankOutlined style={{color:'#ef4444'}} />} />}
            bordered={false}
            style={{ background: 'rgba(255,255,255,0.05)', marginBottom: '0px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
            headStyle={{ color: '#fff', borderBottom: '1px solid #334155', fontSize: '14px' }}
            bodyStyle={{ padding: '12px' }}
          >
            <div style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px' }}>{alignmentResult.source.title}</div>
            <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: <span style={{color:'#00f0ff'}}>展开</span> }} style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 0 }}>
              {alignmentResult.source.content}
            </Paragraph>
          </Card>

          {/* [核心] 3. FedAnchor 相似度连接桥 (Alignment Bridge) */}
          <div style={{ 
            background: 'rgba(10, 20, 30, 0.95)',
            borderLeft: '1px solid #334155', borderRight: '1px solid #334155',
            padding: '10px 15px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'relative',
            zIndex: 10
          }}>
            {/* 左侧文字 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ThunderboltOutlined style={{ color: similarityColor }} />
              <span style={{ color: '#cbd5e1', fontSize: '12px' }}>FedAnchor 语义对齐置信度</span>
            </div>

            {/* 右侧数值进度 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '160px' }}>
               <Progress 
                 percent={similarityPercent} 
                 steps={10} 
                 size="small" 
                 strokeColor={similarityColor} 
                 trailColor="rgba(255,255,255,0.1)"
                 showInfo={false}
                 style={{ width: '100px' }}
               />
               <span style={{ 
                 color: similarityColor, 
                 fontFamily: 'Rajdhani', 
                 fontWeight: 'bold', 
                 fontSize: '18px' 
               }}>
                 {similarityPercent}%
               </span>
            </div>
          </div>

          {/* 4. 国际法 (Target) */}
          <Card 
            size="small" 
            title={<RenderSourceHeader title="国际法参考 (Target)" url={alignmentResult.target.url} icon={<GlobalOutlined style={{color:'#10b981'}} />} />}
            bordered={false}
            style={{ background: 'rgba(255,255,255,0.05)', marginBottom: '20px', marginTop: '0px', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
            headStyle={{ color: '#fff', borderBottom: '1px solid #334155', fontSize: '14px' }}
            bodyStyle={{ padding: '12px' }}
          >
            <div style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px' }}>{alignmentResult.target.title}</div>
            <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: <span style={{color:'#00f0ff'}}>展开</span> }} style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 0 }}>
              {alignmentResult.target.content}
            </Paragraph>
          </Card>

          {/* 5. 案例推荐 */}
          {alignmentResult.cases && alignmentResult.cases.length > 0 && (
            <>
              <Divider orientation="left" style={{ borderColor: '#334155', color: '#faad14' }}><BookOutlined /> 历史指导案例推荐</Divider>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {alignmentResult.cases.map((c, index) => (
                  <Card key={index} size="small" bordered={false} style={{ background: 'rgba(250, 173, 20, 0.1)', border: '1px solid rgba(250, 173, 20, 0.2)' }} bodyStyle={{ padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#faad14', fontWeight: 'bold' }}>
                      <span style={{ maxWidth: '70%' }}>{c.title}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Tag color="gold" style={{ margin: 0 }}>{c.year}</Tag>
                        {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: '#faad14' }}><LinkOutlined /></a>}
                      </div>
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '8px', lineHeight: '1.5' }}>{c.verdict}</div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      );
    };
    return null;
  };

  return (
    <div style={{ position: 'absolute', top: '100px', right: '20px', bottom: '100px', width: PANEL_WIDTH, zIndex: 1000, pointerEvents: 'none', display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ pointerEvents: 'auto', marginRight: '10px', marginTop: '20px', transition: 'all 0.5s', transform: collapsed ? `translateX(${PANEL_WIDTH})` : 'translateX(0)' }}>
        <Button type="primary" shape="circle" icon={collapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ background: '#00f0ff', borderColor: '#00f0ff', color: '#000', boxShadow: '0 0 10px #00f0ff' }} />
      </div>
      <div style={{ width: '100%', height: '100%', pointerEvents: 'auto', transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)', transform: collapsed ? 'translateX(110%)' : 'translateX(0)', opacity: collapsed ? 0.5 : 1 }}>
        <TechCard title={<><FileTextOutlined /> 智能分析面板</>} height="100%">
          <div className="custom-scroll" style={{ padding: '15px', height: '100%', overflowY: 'auto' }}>
            {renderContent()}
          </div>
        </TechCard>
      </div>
    </div>
  );
};

export default RightPanel;