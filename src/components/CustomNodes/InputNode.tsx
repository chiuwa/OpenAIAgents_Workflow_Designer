import React from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { InputNodeData } from '../../types/workflowNodes';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useWorkflowStore } from '../../store/workflowStore';

/**
 * 用戶輸入（Input）節點元件。
 *
 * Args:
 *   data: 節點資料，應符合 InputNodeData 結構。
 *
 * Returns:
 *   React 元件
 */
const InputNode: React.FC<NodeProps<InputNodeData>> = ({ id, data }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const { deleteElements } = useReactFlow();
  const toggleNodeExpansion = useWorkflowStore((state) => state.toggleNodeExpansion);

  const compactMessage = data.message && data.message.length > 40 ? `${data.message.substring(0, 40)}...` : data.message;
  const fullMessage = data.message;

  const onDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  const onToggleExpand = (event: React.MouseEvent) => {
    event.stopPropagation();
    toggleNodeExpansion(id);
  };

  return (
    <div
      style={{
        position: 'relative',
        background: '#23232a',
        borderLeft: isHovered ? `3px solid ${data.isExpanded ? '#16a34a' : '#22c55e'}` : '2px solid #22c55e',
        borderRight: isHovered ? `2.5px solid ${data.isExpanded ? '#16a34a' : '#22c55e'}` : '1.5px solid #3f3f46',
        borderBottom: isHovered ? `2.5px solid ${data.isExpanded ? '#16a34a' : '#22c55e'}` : '1.5px solid #3f3f46',
        borderTop: '6px solid #22c55e',
        borderRadius: '12px',
        boxShadow: isHovered ? `0 4px 16px 0 ${data.isExpanded ? '#16a34a40' : '#22c55e40'}` : '0 2px 8px 0 #00000033',
        padding: '16px 20px',
        width: 250,
        fontSize: '15px',
        color: '#e0e0e0',
        transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <IconButton 
        aria-label="delete"
        onClick={onDelete}
        size="small"
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          color: isHovered ? '#ff7f7f' : '#6b7280',
          backgroundColor: isHovered ? 'rgba(255, 127, 127, 0.1)' : 'transparent',
          zIndex: 10,
          padding: '2px',
          '&:hover': {
            color: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
          }
        }}
      >
        <DeleteIcon fontSize="inherit" />
      </IconButton>

      <IconButton
        aria-label={data.isExpanded ? "collapse" : "expand"}
        onClick={onToggleExpand}
        size="small"
        sx={{
          position: 'absolute',
          top: 2,
          left: 2,
          color: isHovered ? '#4ade80' : '#6b7280',
          backgroundColor: isHovered ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
          zIndex: 10,
          padding: '2px',
          '&:hover': {
            color: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
          }
        }}
      >
        {data.isExpanded ? <ExpandMoreIcon fontSize="inherit" /> : <ChevronRightIcon fontSize="inherit" />}
      </IconButton>

      <div style={{ fontWeight: 800, textAlign: 'center', marginBottom: '10px', fontSize: '16px', letterSpacing: 0.5 }}>
        🟢 {data.name || '用戶輸入 Input'}
      </div>
      
      {data.isExpanded ? (
        <div style={{ marginBottom: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '100px', overflowY: 'auto', fontSize: '14px' }}>
          <strong>訊息:</strong> {fullMessage || '無訊息'}
        </div>
      ) : (
        <div style={{ marginBottom: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '40px', overflowY: 'hidden', fontSize: '13px' }}>
          <strong>訊息:</strong> {compactMessage || '無訊息'}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ borderRadius: 8, width: 18, height: 18, background: '#22c55e', border: '2px solid #fff' }} />
    </div>
  );
};

export default InputNode; 