import React, { useEffect, useState } from 'react';
import { Button, Tag, Progress, Card, Divider, Typography, Tooltip, Segmented } from 'antd';
import { 
  MenuUnfoldOutlined, MenuFoldOutlined, 
  SafetyCertificateOutlined, WarningOutlined, SyncOutlined, 
  FileTextOutlined, BookOutlined, LinkOutlined, GlobalOutlined, BankOutlined,
  RadarChartOutlined, EnvironmentOutlined, AppstoreOutlined, PartitionOutlined,
  ThunderboltOutlined, ArrowDownOutlined
} from '@ant-design/icons';
import { useSystemStore } from '../../stores/useSystemStore';
import TechCard from '../../components/TechCard';
import FedAnchorGraph from '../../components/FedAnchorGraph';
import legalKGData from '../../assets/legal_kg.json';

const { Paragraph } = Typography;

const RightPanel: React.FC = () => {
  const { selectedTargetId, analysisStatus, alignmentResult, geoResult } = useSystemStore();
  const [collapsed, setCollapsed] = useState(true);
  const [viewMode, setViewMode] = useState<'text' | 'graph'>('text');
  const [graphSource, setGraphSource] = useState<'analysis' | 'knowledge'>('analysis');

  const PANEL_WIDTH = '480px';

  useEffect(() => {
    if (selectedTargetId) setCollapsed(false);
    else setCollapsed(true);
  }, [selectedTargetId]);

  // [UI 组件] 带有置信度环的标题
  const RenderSourceHeader = ({ title, url, icon, confidence }: { title: string, url?: string, icon: React.ReactNode, confidence?: number }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        <span style={{ fontWeight: 'bold', color: '#fff' }}>{title}</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* 置信度展示 */}
        {confidence !== undefined && (
          <Tooltip title={`适用置信度: ${(confidence * 100).toFixed(0)}%`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '10px' }}>
               <Progress 
                 type="circle" 
                 percent={Math.round(confidence * 100)} 
                 width={16} 
                 strokeWidth={12} 
                 showInfo={false} 
                 strokeColor={confidence > 0.8 ? '#10b981' : '#f59e0b'} 
               />
               <span style={{ fontSize: '10px', color: confidence > 0.8 ? '#10b981' : '#f59e0b', fontFamily: 'Rajdhani', fontWeight: 'bold' }}>
                 {(confidence * 100).toFixed(0)}%
               </span>
            </div>
          </Tooltip>
        )}
        
        {url && (
          <Tooltip title="跳转至官方来源">
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff' }}>
              <LinkOutlined />
            </a>
          </Tooltip>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (!selectedTargetId) {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <SyncOutlined spin style={{ fontSize: '24px', marginBottom: '10px' }} />
          <p>系统在线<br/>请在地图上选择目标以启动分析</p>
        </div>
      );
    }

    if (analysisStatus === 'analyzing') {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
           <h3 style={{ color: '#00f0ff', fontFamily: 'Rajdhani' }}>FedAnchor Protocol</h3>
           <div style={{ margin: '30px 0' }}>
             <Progress type="circle" percent={72} status="active" strokeColor={{ '0%': '#108ee9', '100%': '#00f0ff' }} format={() => <span style={{fontSize: '12px', color: '#fff'}}>Aligning</span>} />
           </div>
           <div style={{ textAlign: 'left', fontSize: '12px', color: '#94a3b8' }}>
             <p>✔ GIS: 空间定位锁定</p>
             <p style={{ color: '#00f0ff' }}><SyncOutlined spin style={{ marginRight: '8px' }} />FedAnchor: 联邦图谱推理中...</p>
             <p>⚡ RAG: 检索全球海事判例库...</p>
           </div>
        </div>
      );
    }

    if (analysisStatus === 'done' && alignmentResult) {
      const statusColor = alignmentResult.status === 'violation' ? '#ef4444' : alignmentResult.status === 'warning' ? '#f59e0b' : '#10b981';
      const StatusIcon = alignmentResult.status === 'violation' ? WarningOutlined : SafetyCertificateOutlined;
      
      const similarityPercent = (alignmentResult.similarity * 100).toFixed(1);
      const simColor = alignmentResult.similarity > 0.85 ? '#10b981' : alignmentResult.similarity > 0.7 ? '#f59e0b' : '#ef4444';

      return (
        <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* 1. 顶部状态卡片 (固定) */}
          <div style={{ flexShrink: 0 }}>
             <div style={{ 
               background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 0, 0, 0) 100%)', 
               borderLeft: '4px solid #00f0ff', padding: '8px 12px', marginBottom: '10px',
               display: 'flex', alignItems: 'center', justifyContent: 'space-between'
             }}>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ fontSize: '12px', color: '#94a3b8' }}><RadarChartOutlined /> GIS 空间定位</span>
                 <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', fontFamily: 'Rajdhani' }}>
                   {geoResult ? `${geoResult.countryName} · ${geoResult.zoneLabel}` : '公海 (High Seas)'}
                 </span>
               </div>
               <EnvironmentOutlined style={{ fontSize: '18px', color: '#00f0ff', opacity: 0.5 }} />
             </div>

             <div style={{ 
               background: `rgba(${alignmentResult.status === 'violation' ? '220, 38, 38' : '16, 185, 129'}, 0.1)`, 
               border: `1px solid ${statusColor}`, borderRadius: '4px', padding: '10px',
               display: 'flex', alignItems: 'start', gap: '10px'
             }}>
               <StatusIcon style={{ fontSize: '20px', color: statusColor, marginTop: '2px' }} />
               <div>
                 <div style={{ color: statusColor, fontWeight: 'bold', fontSize: '14px' }}>
                   {alignmentResult.status === 'violation' ? '严重违规' : alignmentResult.status === 'warning' ? '存在疑点' : '合规行为'}
                 </div>
                 <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>{alignmentResult.summary}</div>
               </div>
             </div>
          </div>

          {/* 2. 视图切换器 (固定) */}
          <div style={{ flexShrink: 0 }}>
            <Segmented
              options={[
                { label: '文本研判', value: 'text', icon: <AppstoreOutlined /> },
                { label: '联邦图谱', value: 'graph', icon: <PartitionOutlined /> },
              ]}
              value={viewMode}
              onChange={(val) => setViewMode(val as 'text' | 'graph')}
              block
              style={{ background: '#334155', color: '#cbd5e1' }}
            />
          </div>

          {/* 3. 内容区 (可滚动) */}
          {/* 模式 A: 文本模式 (上下布局) */}
          {viewMode === 'text' && (
            <div className="custom-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}> {/* gap 设为0，由中间的 bridge 控制间距 */}
               
               {/* 3.1 国内法 Source */}
               <Card 
                  size="small" 
                  title={<RenderSourceHeader title="国内法依据 (Source)" url={alignmentResult.source.url} icon={<BankOutlined style={{color:'#ef4444'}} />} confidence={alignmentResult.source.confidence} />} 
                  bordered={false} 
                  style={{background:'rgba(239, 68, 68, 0.05)', border:'1px solid rgba(239, 68, 68, 0.2)', marginBottom: '0'}} 
                  headStyle={{color:'#fff', borderBottom:'1px solid rgba(239, 68, 68, 0.2)', fontSize:'12px', padding:'0 10px'}} 
                  bodyStyle={{padding:'10px'}}
               >
                  <div style={{fontWeight:'bold', color:'#e2e8f0', marginBottom:'4px', fontSize:'12px'}}>{alignmentResult.source.title}</div>
                  <Paragraph ellipsis={{rows:5, expandable:true, symbol:<span style={{color:'#00f0ff'}}>+</span>}} style={{color:'#94a3b8', fontSize:'12px', marginBottom:0, lineHeight:'1.5'}}>
                     {alignmentResult.source.content}
                  </Paragraph>
               </Card>

               {/* 3.2 [核心] 上下连接器 (Alignment Bridge) */}
               <div style={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* 背景连接线 */}
                  <div style={{ position: 'absolute', top: 0, bottom: 0, width: '1px', background: `linear-gradient(to bottom, rgba(239,68,68,0.3), ${simColor}, rgba(16,185,129,0.3))`, left: '50%' }}></div>
                  
                  {/* 中间胶囊 */}
                  <div style={{ 
                    position: 'relative', zIndex: 2,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#0b1018', border: `1px solid ${simColor}`, borderRadius: '20px',
                    padding: '4px 15px',
                    boxShadow: `0 0 10px ${simColor}40`
                  }}>
                    <ThunderboltOutlined style={{ color: simColor }} />
                    <span style={{ color: '#cbd5e1', fontSize: '11px' }}>FedAnchor 向量对齐度</span>
                    <span style={{ color: simColor, fontWeight: 'bold', fontFamily: 'Rajdhani', fontSize: '14px' }}>
                      {similarityPercent}%
                    </span>
                  </div>
               </div>

               {/* 3.3 国际法 Target */}
               <Card 
                  size="small" 
                  title={<RenderSourceHeader title="国际法参考 (Target)" url={alignmentResult.target.url} icon={<GlobalOutlined style={{color:'#10b981'}} />} confidence={alignmentResult.target.confidence} />} 
                  bordered={false} 
                  style={{background:'rgba(16, 185, 129, 0.05)', border:'1px solid rgba(16, 185, 129, 0.2)', marginBottom: '15px'}} 
                  headStyle={{color:'#fff', borderBottom:'1px solid rgba(16, 185, 129, 0.2)', fontSize:'12px', padding:'0 10px'}} 
                  bodyStyle={{padding:'10px'}}
               >
                  <div style={{fontWeight:'bold', color:'#e2e8f0', marginBottom:'4px', fontSize:'12px'}}>{alignmentResult.target.title}</div>
                  <Paragraph ellipsis={{rows:5, expandable:true, symbol:<span style={{color:'#00f0ff'}}>+</span>}} style={{color:'#94a3b8', fontSize:'12px', marginBottom:0, lineHeight:'1.5'}}>
                     {alignmentResult.target.content}
                  </Paragraph>
               </Card>

               {/* 3.4 案例 Cases */}
               {alignmentResult.cases.length > 0 && (
                 <div>
                   <Divider orientation="left" style={{borderColor:'#334155', color:'#faad14', margin: '10px 0', fontSize: '12px'}}><BookOutlined/> 历史指导案例</Divider>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '10px' }}>
                     {alignmentResult.cases.map((c, i) => (
                        <Card key={i} size="small" bordered={false} style={{background:'rgba(250,173,20,0.1)', border:'1px solid rgba(250,173,20,0.2)'}} bodyStyle={{padding:'10px'}}>
                           <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: '5px'}}>
                              <div style={{fontWeight:'bold', color:'#faad14', fontSize:'13px', maxWidth:'70%'}}>{c.title}</div>
                              <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
                                 <Tag color="gold" style={{margin:0, fontSize:'10px', lineHeight:'16px'}}>{c.year}</Tag>
                                 {c.confidence && (
                                   <div style={{display:'flex', alignItems:'center', gap:'2px'}}>
                                     <ThunderboltOutlined style={{color: '#f59e0b', fontSize:'10px'}} />
                                     <span style={{fontFamily:'Rajdhani', color:'#f59e0b', fontSize:'12px', fontWeight:'bold'}}>{(c.confidence * 100).toFixed(0)}%</span>
                                   </div>
                                 )}
                              </div>
                           </div>
                           <div style={{color:'#cbd5e1', fontSize:'12px', lineHeight:'1.4'}}>{c.verdict}</div>
                        </Card>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          )}

          {/* 模式 B: 图谱模式 */}
          {viewMode === 'graph' && (
             <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
               <div style={{ flexShrink: 0, marginBottom: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                 <Button size="small" type={graphSource === 'analysis' ? 'primary' : 'dashed'} onClick={() => setGraphSource('analysis')} style={{ fontSize: '12px' }}>本次对齐</Button>
                 <Button size="small" type={graphSource === 'knowledge' ? 'primary' : 'dashed'} onClick={() => setGraphSource('knowledge')} style={{ fontSize: '12px' }}>知识图谱</Button>
               </div>
               
               <div style={{ flex: 1, minHeight: 0 }}>
                  <FedAnchorGraph data={graphSource === 'analysis' ? alignmentResult : legalKGData} mode={graphSource} width={420} height={320} />
               </div>

               <div style={{ flexShrink: 0, marginTop: '10px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                 <div style={{ color: '#00f0ff', fontWeight: 'bold', marginBottom: '2px', fontSize: '12px' }}> <PartitionOutlined /> 图谱解读</div>
                 <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.3' }}>
                   {graphSource === 'analysis' ? "青色虚线代表 FedAnchor 计算出的高维向量对齐路径。" : "展示了基于 UNCLOS 构建的海事法律实体关系本体网络。"}
                 </div>
               </div>
             </div>
          )}
        </div>
      );
    };
    
    if (!renderContent()) return null;
    return null;
  };

  return (
    <div style={{ position: 'absolute', top: '100px', right: '20px', bottom: '100px', width: PANEL_WIDTH, zIndex: 1000, pointerEvents: 'none', display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ pointerEvents: 'auto', marginRight: '10px', marginTop: '20px', transition: 'all 0.5s', transform: collapsed ? `translateX(${PANEL_WIDTH})` : 'translateX(0)' }}>
        <Button type="primary" shape="circle" icon={collapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ background: '#00f0ff', borderColor: '#00f0ff', color: '#000', boxShadow: '0 0 10px #00f0ff' }} />
      </div>

      <div style={{ width: '100%', height: '100%', pointerEvents: 'auto', transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)', transform: collapsed ? 'translateX(110%)' : 'translateX(0)', opacity: collapsed ? 0.5 : 1 }}>
        <TechCard title={<><FileTextOutlined /> 智能分析面板</>} height="100%">
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '15px', overflow: 'hidden' }}>
            {selectedTargetId ? (
               <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  {renderContent()}
               </div>
            ) : (
               renderContent()
            )}
          </div>
        </TechCard>
      </div>
    </div>
  );
};

export default RightPanel;