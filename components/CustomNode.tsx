// components/CustomNode.tsx
'use client';
import React from 'react';
import { Handle, Position } from 'reactflow';

export default function CustomNode({
  data,
}: {
  data: { label: string; properties: { key: string; value: any }[] };
}) {
  return (
    <div
      style={{
        padding: 8,
        border: '1px solid #333',
        borderRadius: 4,
        background: '#fff',
        position: 'relative',
      }}
    >
      {/* 允许连接进来的目标 Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
      />

      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{data.label}</div>
      {data.properties.map((p) => (
        <div key={p.key}>
          <span style={{ fontWeight: 500 }}>{p.key}:</span> {String(p.value)}
        </div>
      ))}

      {/* 允许从这里拖出连线的源 Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
      />
    </div>
  );
}
