'use client';
import React, { useEffect, useState, useRef } from 'react';
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';

// 仅分支对象/数组节点，叶子键值内联
import { flattenTreeForFlow } from '../utils/treeUtils';

type Props = { data: any; onChange: (newTree: any) => void };

const nodeTypes = { custom: CustomNode };

export default function GraphEditor({ data, onChange }: Props) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    const { nodes: n, edges: e } = flattenTreeForFlow(data);
    setNodes(n);
    setEdges(e);
  }, [data]);

  const onConnect = (c: Connection) => setEdges((eds) => addEdge(c, eds));
  const onNodesChange: OnNodesChange = (chg) => setNodes((nds) => applyNodeChanges(chg, nds));
  const onEdgesChange: OnEdgesChange = (chg) => setEdges((eds) => applyEdgeChanges(chg, eds));

  const onNodeDragStop = (_: any, node: Node) => {
    if (!rfInstance) return;
    const { project } = rfInstance;
    const pos = project(node.position);
    for (const tgt of nodes) {
      if (tgt.id === node.id) continue;
      const tpos = project(tgt.position);
      if (Math.hypot(pos.x - tpos.x, pos.y - tpos.y) < 50) {
        onChange(require('../utils/treeUtils').reparentNode(data, node.id, tgt.id));
        break;
      }
    }
  };

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        onNodeDragStop={onNodeDragStop}
      >
        <Background key="bg" gap={16} />
        <Controls key="ctrl" />
      </ReactFlow>
    </div>
  );
}