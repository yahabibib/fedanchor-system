import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { type LegalReport } from '../services/llmService';

// 定义两种数据源类型
type AnalysisData = LegalReport;

interface StaticGraphData {
  nodes: Array<{ id: string; group: string }>;
  links: Array<{ source: string; target: string; relation: string }>;
}

interface Props {
  data: AnalysisData | StaticGraphData;
  mode: 'analysis' | 'knowledge';
  width?: number;
  height?: number;
}

// 辅助函数：文字截断
const truncate = (str: string, len: number) => {
  if (!str) return '';
  // 去掉书名号等干扰字符，让显示更干净
  const cleanStr = str.replace(/[《》]/g, '');
  if (cleanStr.length <= len) return cleanStr;
  return cleanStr.substring(0, len) + '..';
};

const FedAnchorGraph: React.FC<Props> = ({ data, mode, width = 450, height = 400 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // 清空画布
    d3.select(svgRef.current).selectAll("*").remove();

    let nodes: any[] = [];
    let links: any[] = [];

    // --- 1. 本次对齐分析模式 (Analysis Mode) ---
    if (mode === 'analysis') {
      const report = data as AnalysisData;
      
      // 提取具体法条名称作为 ID 和 Label
      const sourceTitle = report.source.title || "未知国内法";
      const targetTitle = report.target.title || "未知国际法";
      const centerLabel = "涉事目标";

      nodes = [
        // 中心节点
        { id: 'center', group: 'center', label: centerLabel, fullText: report.summary, radius: 18 },
        
        // 国内法具体法条 (红色)
        { id: sourceTitle, group: 'domestic', label: truncate(sourceTitle, 6), fullText: sourceTitle, radius: 25 },
        
        // 国际法具体法条 (蓝色)
        { id: targetTitle, group: 'international', label: truncate(targetTitle, 6), fullText: targetTitle, radius: 25 },
        
        // 具体判例 (黄色)
        ...report.cases.map((c, i) => ({ 
          id: `case_${i}`, // ID 保持唯一
          group: 'case', 
          label: truncate(c.title, 5), // 显示案例名
          fullText: c.title,
          radius: 15 
        }))
      ];

      links = [
        // [核心] FedAnchor 对齐虚线：连接具体的两个法条
        { source: sourceTitle, target: targetTitle, type: 'alignment', value: 3, relation: 'FedAnchor语义对齐' },
        
        // 引用实线：法条 -> 目标
        { source: sourceTitle, target: 'center', type: 'citation', value: 2, relation: '管辖依据' },
        { source: targetTitle, target: 'center', type: 'citation', value: 2, relation: '国际公约' },
        
        // 引用实线：判例 -> 国际法
        ...report.cases.map((c, i) => ({ 
          source: `case_${i}`, 
          target: targetTitle, 
          type: 'citation', 
          value: 1, 
          relation: '引用' 
        }))
      ];
    } 
    // --- 2. 全量知识图谱模式 (Knowledge Mode) ---
    else if (mode === 'knowledge') {
      const graph = data as StaticGraphData;
      
      nodes = graph.nodes.map(n => ({ 
        ...n, 
        radius: n.group === '国家' || n.group === '主权' ? 18 : 
                n.group === 'Text' ? 5 : 12,
        label: n.id.length > 5 ? n.id.substring(0, 5) + '..' : n.id, // 截断长文本
        fullText: n.id
      }));
      
      links = graph.links.map(l => ({ ...l, type: 'static', value: 1 }));
    }

    // --- 颜色映射 ---
    const getColor = (group: string) => {
      // Analysis Colors
      if (group === 'domestic') return '#ef4444'; // 红
      if (group === 'international') return '#10b981'; // 绿/蓝
      if (group === 'case') return '#f59e0b'; // 黄
      if (group === 'center') return '#00f0ff'; // 核心目标：青色

      // Knowledge Colors
      if (['国家', '主权'].includes(group)) return '#ef4444';
      if (['海域', '法约', '领海界限'].includes(group)) return '#10b981'; // 统一用绿色/青色系代表国际/海域
      if (['船舶', '海事工作人员'].includes(group)) return '#f59e0b';
      if (group === 'Text') return '#64748b';
      
      return '#cbd5e1';
    };

    // --- D3 渲染 ---
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(mode === 'knowledge' ? 60 : 120)) // 分析模式下距离拉大，防止字叠在一起
      .force("charge", d3.forceManyBody().strength(mode === 'knowledge' ? -100 : -400)) // 分析模式下排斥力加大
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.radius + 15)); // 防止碰撞

    const svg = d3.select(svgRef.current);
    const g = svg.append("g");

    // 缩放
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom as any);

    // 箭头定义
    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrow-grey")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28) // 调整箭头位置，避免被圆圈遮挡
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#666");

    defs.append("marker")
      .attr("id", "arrow-cyan")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#00f0ff");

    // 绘制连线
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => d.value)
      .attr("stroke", d => d.type === 'alignment' ? '#00f0ff' : '#555')
      .attr("stroke-dasharray", d => d.type === 'alignment' ? "5,5" : "0")
      .attr("marker-end", d => d.type === 'alignment' ? "url(#arrow-cyan)" : "url(#arrow-grey)")
      .attr("class", d => d.type === 'alignment' ? "alignment-link" : "");

    // 绘制节点
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // 节点圆圈
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => getColor(d.group))
      .attr("stroke", "#fff")
      .attr("stroke-width", d => d.group === 'center' ? 2 : 1.5)
      .attr("stroke-opacity", 0.9);

    // 节点文字
    node.append("text")
      .text(d => d.group === 'Text' ? '' : d.label)
      .attr("x", 0)
      .attr("y", d => d.radius + 14) // 文字下移
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", d => d.group === 'center' ? "12px" : "10px")
      .attr("font-family", "Rajdhani, 'Microsoft YaHei'")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 2px #000");

    // 悬浮提示 (完整名称)
    node.append("title").text(d => d.fullText || d.id);
    link.append("title").text(d => d.relation || '');

    // 仿真 Tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // 虚线动画样式
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes dash {
        to { stroke-dashoffset: -10; }
      }
      .alignment-link {
        animation: dash 1s linear infinite;
        opacity: 0.8;
      }
    `;
    svgRef.current.appendChild(style);

  }, [data, mode, width, height]);

  return (
    <div style={{ position: 'relative', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <svg ref={svgRef} width={width} height={height} style={{ display: 'block', cursor: 'grab' }} />
      
      {/* 动态图例 */}
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '10px', color: '#cbd5e1', background: 'rgba(0,0,0,0.7)', padding: '6px', borderRadius: '4px', pointerEvents: 'none' }}>
        {mode === 'analysis' ? (
           <>
             <div style={{marginBottom:'2px'}}><span style={{color:'#ef4444'}}>●</span> 具体国内法条 (Source)</div>
             <div style={{marginBottom:'2px'}}><span style={{color:'#10b981'}}>●</span> 具体国际法条 (Target)</div>
             <div style={{marginBottom:'2px'}}><span style={{color:'#f59e0b'}}>●</span> 具体判例 (Case)</div>
             <div><span style={{color:'#00f0ff'}}>---</span> FedAnchor 语义映射</div>
           </>
        ) : (
           <>
             <div style={{marginBottom:'2px'}}><span style={{color:'#ef4444'}}>●</span> 国家/主权</div>
             <div style={{marginBottom:'2px'}}><span style={{color:'#10b981'}}>●</span> 海域/公约</div>
             <div style={{marginBottom:'2px'}}><span style={{color:'#f59e0b'}}>●</span> 船舶/人员</div>
           </>
        )}
      </div>
    </div>
  );
};

export default FedAnchorGraph;