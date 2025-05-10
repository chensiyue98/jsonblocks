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

// Layout constants
const NODE_WIDTH = 300;
const HEADER_HEIGHT = 28;
const V_PADDING = 16;
const ROW_HEIGHT = 24;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', align: 'UL', nodesep: 30, ranksep: 60 });

  nodes.forEach((n) => {
    const propCount = Array.isArray(n.data.properties)
      ? n.data.properties.length
      : 0;
    const height = HEADER_HEIGHT + propCount * ROW_HEIGHT + V_PADDING;
    dagreGraph.setNode(n.id, { width: NODE_WIDTH, height });
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
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Add a new utility function to transfer properties between nodes
const transferNodeProperty = (tree: any, sourceNodeId: string, targetNodeId: string, propertyIndex: number) => {
  // Create a deep copy of the tree to avoid mutations
  const newTree = JSON.parse(JSON.stringify(tree));
  
  // Find the source and target nodes
  const findNode = (obj: any, id: string): any => {
    if (obj.id === id) return obj;
    if (obj.children) {
      for (const child of obj.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  const sourceNode = findNode(newTree, sourceNodeId);
  const targetNode = findNode(newTree, targetNodeId);
  
  if (!sourceNode || !targetNode || !Array.isArray(sourceNode.properties)) {
    return tree;
  }
  
  // Move the property from source to target
  if (propertyIndex >= 0 && propertyIndex < sourceNode.properties.length) {
    const property = sourceNode.properties[propertyIndex];
    
    // Add to target node
    if (!Array.isArray(targetNode.properties)) {
      targetNode.properties = [];
    }
    targetNode.properties.push(property);
    
    // Remove from source node
    sourceNode.properties.splice(propertyIndex, 1);
  }
  
  return newTree;
};

export default function GraphEditor({ data, onChange }: Props) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // Check theme
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkTheme(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

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

  const handleRowTransfer = (sourceNodeId: string, targetNodeId: string, propertyIndex: number) => {
    const updatedTree = transferNodeProperty(data, sourceNodeId, targetNodeId, propertyIndex);
    onChange(updatedTree);
  };

  useEffect(() => {
    const { nodes: rawNodes, edges: rawEdges } = flattenTreeForFlow(data);
    
    // Add onRowTransfer handler to each node's data
    const nodesWithHandlers = rawNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onRowTransfer: handleRowTransfer
      }
    }));
    
    const { nodes: ln, edges: le } = getLayoutedElements(nodesWithHandlers, rawEdges);
    setNodes(ln);
    setEdges(le);
  }, [data, onChange]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        defaultEdgeOptions={{ type: 'step' }}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        onNodeDragStop={onNodeDragStop}
        nodesConnectable={false}
        fitView
      >
        <Background color={isDarkTheme ? '#555' : '#aaa'} gap={16} />
        <Controls key="ctrl" />
      </ReactFlow>
    </div>
  );
}