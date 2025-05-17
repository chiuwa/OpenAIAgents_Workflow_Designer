import React from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { GuardrailNodeData, GuardrailType } from '../../types/workflowNodes';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Tooltip from '@mui/material/Tooltip';
import { useWorkflowStore } from '../../store/workflowStore';
// import SecurityIcon from '@mui/icons-material/Security'; // Example for shield icon

/**
 * Custom Guardrail Node Component.
 *
 * Displays information about a Guardrail, including its type and name.
 * It allows connection from its source handle to an Agent node's guardrail input.
 *
 * Args:
 *   id: Node ID.
 *   data: Node data, conforming to GuardrailNodeData.
 *
 * Returns:
 *   A React functional component representing the Guardrail node.
 */
const GuardrailNode: React.FC<NodeProps<GuardrailNodeData>> = ({ id, data }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const { deleteElements } = useReactFlow();
  const toggleNodeExpansion = useWorkflowStore((state) => state.toggleNodeExpansion);

  if (!data || data.nodeType !== 'guardrail') {
    // This check ensures data is of type GuardrailNodeData
    // console.error('GuardrailNode received invalid data:', data);
    return null; 
  }

  const onDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  const onToggleExpand = (event: React.MouseEvent) => {
    event.stopPropagation();
    toggleNodeExpansion(id);
  };

  const borderColor = '#8B5CF6'; // Violet-500 for Guardrail
  const hoverBorderColor = '#7C3AED'; // A slightly darker/saturated violet for hover when expanded
  const icon = '🛡️'; // Shield icon

  const displayGuardrailType = data.guardrailType === GuardrailType.INPUT ? '輸入型 Guardrail' : '輸出型 Guardrail';
  
  // Truncate long descriptions or names for display on the node card
  const truncateText = (text: string | undefined, maxLength: number): string => {
    if (!text) return 'N/A';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const compactInternalAgentName = truncateText(data.internalAgentName, 20);
  const fullInternalAgentName = data.internalAgentName;
  const compactDescription = truncateText(data.description, 30);
  const fullDescription = data.description;
  const displayTripwireLogic = truncateText(data.tripwireConditionLogic, 40);
  const internalPydanticModelName = data.internalAgentPydanticSchema?.modelName;

  return (
    <div
      style={{
        position: 'relative',
        background: '#23232a',
        borderLeft: isHovered ? `2.5px solid ${data.isExpanded ? hoverBorderColor : borderColor}` : `1.5px solid #3f3f46`,
        borderRight: isHovered ? `2.5px solid ${data.isExpanded ? hoverBorderColor : borderColor}` : `1.5px solid #3f3f46`,
        borderBottom: isHovered ? `2.5px solid ${data.isExpanded ? hoverBorderColor : borderColor}` : `1.5px solid #3f3f46`,
        borderTop: `6px solid ${borderColor}`,
        borderRadius: '12px',
        boxShadow: isHovered ? `0 4px 16px 0 ${data.isExpanded ? hoverBorderColor : borderColor}80` : '0 2px 8px 0 #00000033',
        padding: '16px 20px',
        width: 250,
        minHeight: data.isExpanded ? 180 : 120, // Adjust minHeight when expanded
        fontSize: '15px',
        color: '#e0e0e0',
        transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
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
          color: isHovered ? '#ff7f7f' : '#6b7280', // Red on hover for delete
          backgroundColor: isHovered ? 'rgba(255, 127, 127, 0.1)' : 'transparent',
          zIndex: 10,
          padding: '2px',
          '&:hover': {
            color: '#ef4444', // Brighter red on hover
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
          },
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
          color: isHovered ? '#A78BFA' : '#6b7280', // Guardrail theme color for icon hover (lighter violet)
          backgroundColor: isHovered ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
          zIndex: 10,
          padding: '2px',
          '&:hover': {
            color: borderColor, 
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
          }
        }}
      >
        {data.isExpanded ? <ExpandMoreIcon fontSize="inherit" /> : <ChevronRightIcon fontSize="inherit" />}
      </IconButton>

      {/* Node Header */}
      <Tooltip title={data.name || 'Guardrail'} placement="top">
        <div style={{ fontWeight: 800, textAlign: 'center', marginBottom: '10px', fontSize: '16px', letterSpacing: 0.5 }}>
          {icon} {truncateText(data.name, 20) || 'Guardrail'}
        </div>
      </Tooltip>

      {/* Node Content */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '13px', width: '100%' }}>
        <div style={{ color: '#c0c0c0', background: '#2c2c32', padding: '3px 8px', borderRadius: '4px', textAlign:'center' }}>
          {displayGuardrailType}
        </div>

        {data.isExpanded ? (
          <>
            {fullDescription && (
              <Tooltip title={fullDescription} placement="bottom">
                <div style={{ fontStyle: 'italic', color: '#b0b0b0', textAlign: 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '50px', overflowY:'auto', width:'100%' }}>
                  {truncateText(fullDescription, 60)}
                </div>
              </Tooltip>
            )}
            {fullInternalAgentName && (
              <div style={{ color: '#a0a0a0', textAlign: 'center', width:'100%' }}>
                <strong>檢查器:</strong> {fullInternalAgentName}
              </div>
            )}
            {internalPydanticModelName && (
                <div style={{ fontSize: '12px', color: '#a0a0a0', textAlign: 'center' }}>
                    <strong>檢查器模型:</strong> {truncateText(internalPydanticModelName, 20)}
                </div>
            )}
            {data.tripwireConditionLogic && (
              <Tooltip title={data.tripwireConditionLogic} placement="bottom">
                <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', textAlign: 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight:'30px', overflowY:'auto', width:'100%' }}>
                  <strong>觸發:</strong> {displayTripwireLogic}
                </div>
              </Tooltip>
            )}
          </>
        ) : (
          <>
            {compactDescription && (
                <div style={{ fontStyle: 'italic', color: '#b0b0b0', textAlign: 'center', maxHeight: '36px', overflowY: 'hidden', width:'100%' }}>
                    {compactDescription}
                </div>
            )}
            {data.internalAgentName && (
              <div style={{ fontSize: '12px', color: '#a0a0a0', textAlign: 'center', width:'100%' }}>
                <strong>檢查器:</strong> {compactInternalAgentName}
              </div>
            )}
          </>
        )}
      </div>
      
      <div style={{marginTop: 'auto', paddingTop: '8px'}}>
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="guardrail-output"
          style={{ borderRadius: 8, width: 18, height: 18, background: borderColor, border: '2px solid #fff' }} 
        />
      </div>
    </div>
  );
};

export default React.memo(GuardrailNode); 