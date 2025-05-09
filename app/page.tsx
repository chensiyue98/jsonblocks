'use client';
import { useState, useCallback, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import GraphEditor from '../components/GraphEditor';

function jsonToTree(value: any, name: string = 'root', path: string = '0'): any {
  const node: any = { id: path, label: name, children: [] };
  if (value !== null && typeof value === 'object') {
    if (Array.isArray(value)) {
      node.label = name + ' [Array]';
      node.children = value.map((v, i) => jsonToTree(v, `${i}`, `${path}-${i}`));
    } else {
      node.label = name + ' {Object}';
      node.children = Object.entries(value).map(([k, v], i) => jsonToTree(v, k, `${path}-${k}`));
    }
  } else {
    node.label = `${name}: ${String(value)}`;
  }
  return node;
}

function treeToJson(node: any): any {
  const { label, children } = node;
  if (!children || children.length === 0) {
    const idx = label.indexOf(': ');
    const raw = idx >= 0 ? label.slice(idx + 2) : '';
    if (raw === 'null') return null;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    const num = Number(raw);
    if (!isNaN(num) && raw.trim() !== '') return num;
    return raw;
  }
  if (label.endsWith('{Object}')) {
    const obj: any = {};
    children.forEach((c: any) => {
      const key = c.label.split(/[: {\[]/)[0];
      obj[key] = treeToJson(c);
    });
    return obj;
  }
  if (label.endsWith('[Array]')) {
    const arr: any[] = [];
    children.forEach((c: any) => {
      const idx = parseInt(c.label.split(/[: {\[]/)[0], 10);
      arr[idx] = treeToJson(c);
    });
    return arr;
  }
  const anyObj: any = {};
  children.forEach((c: any) => {
    const key = c.label.split(/[: {\[]/)[0];
    anyObj[key] = treeToJson(c);
  });
  return anyObj;
}

export default function HomePage() {
  const initial = JSON.stringify({ orderId: 'A123', customer: { name: 'Jane' }, products: [1, 2] }, null, 2);
  const [rawJson, setRawJson] = useState(initial);
  const [treeData, setTreeData] = useState(() => jsonToTree(JSON.parse(initial)));
  const [error, setError] = useState('');
  const [editorTheme, setEditorTheme] = useState('light');

  // Monitor theme changes
  useEffect(() => {
    // Initial theme setup
    const isDark = document.documentElement.classList.contains('dark');
    setEditorTheme(isDark ? 'vs-dark' : 'light');

    // Create observer to watch for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setEditorTheme(isDark ? 'vs-dark' : 'light');
        }
      });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.documentElement, { attributes: true });

    // Cleanup observer on component unmount
    return () => observer.disconnect();
  }, []);

  const handleJsonChange = (value?: string) => {
    const txt = value || '';
    setRawJson(txt);
    try {
      const parsed = JSON.parse(txt);
      setTreeData(jsonToTree(parsed));
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTreeUpdate = useCallback((newTree: any) => {
    setTreeData(newTree);
    const json = treeToJson(newTree);
    setRawJson(JSON.stringify(json, null, 2));
    setError('');
  }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 3rem)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 8 }}>
        <Editor
          height="100%"
          defaultLanguage="json"
          value={rawJson}
          theme={editorTheme}
          onChange={handleJsonChange}
          options={{
            minimap: { enabled: false },
            fontFamily: 'monospace',
            automaticLayout: true,
          }}
        />
        {error && <div style={{ color: 'red', marginTop: 4 }}>JSON 解析错误: {error}</div>}
      </div>
      <div style={{ flex: 2, borderLeft: '1px solid var(--menubar-border)' }}>
        <GraphEditor data={treeData} onChange={handleTreeUpdate} />
      </div>
    </div>
  );
}
