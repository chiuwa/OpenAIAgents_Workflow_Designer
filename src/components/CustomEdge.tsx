import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * 自訂 Edge 元件，支援刪除按鈕。
 *
 * Args:
 *   id: edge id
 *   sourceX, sourceY, targetX, targetY: 端點座標
 *   style, markerEnd: 樣式
 *   data: 可選，edge data
 *   selected: 是否被選中
 *   setEdges: 用於刪除 edge 的函數（由外部傳入）
 *
 * Returns:
 *   React 元件
 */
const CustomEdge: React.FC<EdgeProps> = ({ id, sourceX, sourceY, targetX, targetY, style, markerEnd, selected, data }) => {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY });

  // 刪除按鈕點擊
  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data && typeof data.onDelete === 'function') {
      data.onDelete(id);
    }
  };

  return (
    <g>
      <path id={id} style={style} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} />
      <foreignObject x={labelX - 16} y={labelY - 16} width={32} height={32} style={{ overflow: 'visible' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>
          <button
            onClick={onDelete}
            style={{
              background: selected ? '#ef4444' : '#23232a',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: selected ? '0 0 0 2px #ef4444' : '0 1px 4px 0 #00000033',
              cursor: 'pointer',
              transition: 'all 0.18s',
              color: selected ? '#fff' : '#a3a3a3',
              opacity: 0.92,
            }}
            title="刪除連線"
          >
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      </foreignObject>
    </g>
  );
};

export default CustomEdge; 