'use client';
import { useState, useCallback, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import GraphEditor from './components/GraphEditor';
import exampleJson from './resources/example.json';

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

  // 叶子节点处理
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

  // 对象节点处理
  if (label.includes('{Object}')) {
    const obj: any = {};
    children.forEach((c: any) => {
      // 提取不含修饰符的键名
      const key = c.label.split(/[: {\[]/)[0];
      obj[key] = treeToJson(c);
    });
    return obj;
  }

  // 数组节点处理
  if (label.includes('[Array]')) {
    const arr: any[] = [];
    children.forEach((c: any) => {
      // 尝试提取索引（考虑到标签可能是 "0: value" 或 "0 {Object}" 格式）
      let idx;
      if (c.label.includes(': ')) {
        idx = parseInt(c.label.split(':', 1)[0], 10);
      } else {
        idx = parseInt(c.label.split(/[{\[ ]/)[0], 10);
      }

      if (!isNaN(idx)) {
        arr[idx] = treeToJson(c);
      } else {
        // 无法解析索引时，添加到数组末尾
        arr.push(treeToJson(c));
      }
    });
    return arr;
  }

  // 兜底处理，处理没有明确标记的节点
  const anyObj: any = {};
  children.forEach((c: any) => {
    const key = c.label.split(/[: {\[]/)[0];
    anyObj[key] = treeToJson(c);
  });
  return anyObj;
}

export default function HomePage() {
  // use /resources/example.json
  const initial = JSON.stringify(exampleJson, null, 2);
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
