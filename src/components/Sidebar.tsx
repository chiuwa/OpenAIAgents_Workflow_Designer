import React from 'react';
import { Card } from 'antd';

/**
 * 左側元件面板，提供可拖曳的節點類型。
 *
 * Returns:
 *   React 元件
 */
const Sidebar: React.FC = () => {
  /**
   * 處理拖曳開始事件。
   * @param type 節點類型
   */
  const onDragStart = (event: React.DragEvent, type: string) => {
    console.log('[Sidebar] Drag start:', type);
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{ width: 200, padding: 16 }}>
      <Card title="元件庫" size="small">
        <div draggable onDragStart={e => onDragStart(e, 'agent')} style={{ marginBottom: 8, cursor: 'grab' }}>🧑‍💼 Agent 節點</div>
        <div draggable onDragStart={e => onDragStart(e, 'runner')} style={{ marginBottom: 8, cursor: 'grab' }}>🏃 Runner 節點</div>
        <div draggable onDragStart={e => onDragStart(e, 'functionTool')} style={{ marginBottom: 8, cursor: 'grab' }}>🛠️ Function Tool 節點</div>
        <div draggable onDragStart={e => onDragStart(e, 'input')} style={{ marginBottom: 8, cursor: 'grab' }}>🟢 Input 節點</div>
        <div draggable onDragStart={e => onDragStart(e, 'guardrail')} style={{ marginBottom: 8, cursor: 'grab' }}>🛡️ Guardrail 節點</div>
        <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>拖曳元件到畫布以建立節點</div>
      </Card>
    </div>
  );
};

export default Sidebar;
