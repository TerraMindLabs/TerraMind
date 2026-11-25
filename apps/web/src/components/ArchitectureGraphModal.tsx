import React, { useMemo, useState } from 'react';

interface ArchitectureGraphModalProps {
  open: boolean;
  loading: boolean;
  mermaid: string;
  tfBinary: string;
  onClose: () => void;
}

interface GraphNode {
  id: string;
  label: string;
  level: number;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

function parseMermaidFlowchart(src: string): { nodes: GraphNode[]; edges: GraphEdge[]; width: number; height: number } {
  const nodeMap = new Map<string, string>();
  const edges: GraphEdge[] = [];

  for (const rawLine of src.split('\n')) {
    const line = rawLine.trim();
    const nodeMatch = line.match(/^([a-zA-Z0-9_]+)\["([^"]+)"\]$/);
    if (nodeMatch) {
      nodeMap.set(nodeMatch[1], nodeMatch[2]);
      continue;
    }
    const edgeMatch = line.match(/^([a-zA-Z0-9_]+)\s*-->\s*([a-zA-Z0-9_]+)$/);
    if (edgeMatch) {
      edges.push({ from: edgeMatch[1], to: edgeMatch[2] });
      if (!nodeMap.has(edgeMatch[1])) nodeMap.set(edgeMatch[1], edgeMatch[1]);
      if (!nodeMap.has(edgeMatch[2])) nodeMap.set(edgeMatch[2], edgeMatch[2]);
    }
  }

  // Compute topological level (longest path from roots)
  const levelMap = new Map<string, number>();
  for (const id of nodeMap.keys()) levelMap.set(id, 0);

  for (let iter = 0; iter < nodeMap.size; iter++) {
    let changed = false;
    for (const e of edges) {
      const nextLvl = (levelMap.get(e.from) || 0) + 1;
      if (nextLvl > (levelMap.get(e.to) || 0)) {
        levelMap.set(e.to, nextLvl);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const byLevel = new Map<number, string[]>();
  for (const [id, lvl] of levelMap.entries()) {
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(id);
  }

  const boxW = 220;
  const boxH = 44;
  const gapX = 28;
  const gapY = 64;
  const padX = 24;
  const padY = 24;

  const maxPerRow = Math.max(1, ...Array.from(byLevel.values()).map((arr) => arr.length));
  const totalW = Math.max(560, maxPerRow * (boxW + gapX) - gapX + padX * 2);
  const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);
  const totalH = Math.max(220, levels.length * (boxH + gapY) - gapY + padY * 2);

  const nodes: GraphNode[] = [];
  for (const lvl of levels) {
    const ids = byLevel.get(lvl)!;
    const rowW = ids.length * (boxW + gapX) - gapX;
    const startX = (totalW - rowW) / 2;
    ids.forEach((id, idx) => {
      nodes.push({
        id,
        label: nodeMap.get(id) || id,
        level: lvl,
        x: startX + idx * (boxW + gapX),
        y: padY + lvl * (boxH + gapY)
      });
    });
  }

  return { nodes, edges, width: totalW, height: totalH };
}

export const ArchitectureGraphModal: React.FC<ArchitectureGraphModalProps> = ({
  open,
  loading,
  mermaid,
  tfBinary,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'diagram' | 'code'>('diagram');
  const [copied, setCopied] = useState(false);

  const graph = useMemo(() => parseMermaidFlowchart(mermaid), [mermaid]);
  const nodeLookup = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph.nodes]);

  if (!open) return null;

  const boxW = 220;
  const boxH = 44;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--side)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '88vh',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <strong style={{ fontSize: '14px', color: 'var(--text)' }}>
            🗺️ Interactive Architecture Preview ({graph.nodes.length} resources · {graph.edges.length} links)
          </strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setViewMode('diagram')}
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                border: '1px solid var(--border)',
                background: viewMode === 'diagram' ? '#2563eb' : 'var(--bg)',
                color: viewMode === 'diagram' ? '#fff' : 'var(--text)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Visual Diagram
            </button>
            <button
              type="button"
              onClick={() => setViewMode('code')}
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                border: '1px solid var(--border)',
                background: viewMode === 'code' ? '#2563eb' : 'var(--bg)',
                color: viewMode === 'code' ? '#fff' : 'var(--text)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Mermaid Code
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
          Dependency graph generated from <code>{tfBinary} graph</code> and workspace <code>.tf</code> resources.
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
            Generating architecture diagram...
          </div>
        ) : viewMode === 'diagram' ? (
          <div
            style={{
              overflow: 'auto',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              maxHeight: '58vh',
              padding: '8px'
            }}
          >
            <svg width={graph.width} height={graph.height} style={{ display: 'block', margin: '0 auto' }}>
              <defs>
                <marker id="tm-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0,1 L7,4 L0,7 Z" fill="#60a5fa" />
                </marker>
              </defs>

              {graph.edges.map((e, idx) => {
                const fromNode = nodeLookup.get(e.from);
                const toNode = nodeLookup.get(e.to);
                if (!fromNode || !toNode) return null;
                const x1 = fromNode.x + boxW / 2;
                const y1 = fromNode.y + boxH;
                const x2 = toNode.x + boxW / 2;
                const y2 = toNode.y;
                const midY = (y1 + y2) / 2;
                return (
                  <path
                    key={`${e.from}-${e.to}-${idx}`}
                    d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2 - 2}`}
                    fill="none"
                    stroke="#60a5fa"
                    strokeOpacity={0.7}
                    strokeWidth={1.6}
                    markerEnd="url(#tm-arrow)"
                  />
                );
              })}

              {graph.nodes.map((n) => {
                const isData = n.label.startsWith('data.');
                const shortLabel = n.label.length > 30 ? n.label.slice(0, 29) + '…' : n.label;
                return (
                  <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                    <title>{n.label}</title>
                    <rect
                      width={boxW}
                      height={boxH}
                      rx={8}
                      fill={isData ? 'rgba(168, 85, 247, 0.12)' : 'rgba(59, 130, 246, 0.12)'}
                      stroke={isData ? '#a855f7' : '#3b82f6'}
                      strokeWidth={1.4}
                    />
                    <text
                      x={boxW / 2}
                      y={boxH / 2 + 4}
                      textAnchor="middle"
                      fill="var(--text)"
                      fontSize="11.5"
                      fontFamily="JetBrains Mono, Menlo, monospace"
                    >
                      {shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <pre
            style={{
              margin: 0,
              padding: '12px',
              borderRadius: '6px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              maxHeight: '58vh',
              overflow: 'auto',
              whiteSpace: 'pre-wrap'
            }}
          >
            {mermaid}
          </pre>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(mermaid);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {copied ? '✓ Copied' : 'Copy Mermaid'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
