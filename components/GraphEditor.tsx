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
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';

import { flattenTreeForFlow, reparentNode } from '../utils/treeUtils';

type Props = { data: any; onChange: (newTree: any) => void };

const nodeTypes = { custom: CustomNode };

// 布局参数
const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', align: 'UL', nodesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };  
}

export default function GraphEditor({ data, onChange }: Props) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    const { nodes: rawNodes, edges: rawEdges } = flattenTreeForFlow(data);
    const { nodes: ln, edges: le } = getLayoutedElements(rawNodes, rawEdges);
    setNodes(ln);
    setEdges(le);
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
        onChange(reparentNode(data, node.id, tgt.id));
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
        fitView
      >
        <Background key="bg" gap={16} />
        <Controls key="ctrl" />
      </ReactFlow>
    </div>
  );
}