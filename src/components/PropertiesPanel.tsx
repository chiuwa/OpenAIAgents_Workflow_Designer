import React from 'react';
// import { Form, Input, Select, Switch } from 'antd'; // AntD imports removed
import { useWorkflowStore } from '../store/workflowStore';
import { CustomNodeData, AgentNodeData, RunnerNodeData, FunctionToolNodeData, NodeBaseData, InputNodeData, FunctionToolParameter, PydanticModelSchema, PydanticField, GuardrailNodeData, GuardrailType } from '../types/workflowNodes';
import { Node } from 'reactflow';
import Editor from '@monaco-editor/react'; // Import Monaco Editor

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

// const { TextArea } = Input; // Removed
// const { Option } = Select; // Removed

// Python keywords for basic validation (can be expanded or imported if needed)
const PYTHON_KEYWORDS_UI = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import',
  'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while',
  'with', 'yield'
]);

const isValidPythonIdentifier = (name: string): { valid: boolean; message: string } => {
  if (!name || name.trim() === '') {
    return { valid: false, message: '名稱不能為空' };
  }
  if (/^[0-9]/.test(name)) {
    return { valid: false, message: '名稱不能以數字開頭' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return { valid: false, message: '名稱只能包含字母、數字和下劃線' };
  }
  if (PYTHON_KEYWORDS_UI.has(name)) {
    return { valid: false, message: '名稱不能是 Python 關鍵字' };
  }
  return { valid: true, message: '' };
};

const commonTextFieldProps = {
  variant: 'outlined' as 'outlined',
  fullWidth: true,
  size: 'small' as 'small',
  margin: 'normal' as 'normal',
};

/**
 * 渲染 Agent 節點的屬性表單。
 */
const AgentProperties: React.FC<{ nodeId: string; data: AgentNodeData }> = ({ nodeId, data }) => {
  const { updateNodeData, nodes: allNodes, edges: allEdges } = useWorkflowStore();

  const [modelNameValidation, setModelNameValidation] = React.useState<{ valid: boolean; message: string }>({ valid: true, message: '' });
  const [fieldNameValidations, setFieldNameValidations] = React.useState<Record<string, { valid: boolean; message: string }>>({});
  
  // Determine if Pydantic schema is active based on its presence
  const hasPydanticSchema = !!data.pydanticSchema;

  const handleChange = (field: keyof AgentNodeData, value: any) => {
    // No special handling for output_type anymore, directly update other fields
    updateNodeData(nodeId, { [field]: value } as Partial<AgentNodeData>);
  };

  // Toggle Pydantic Schema for Agent
  const togglePydanticSchemaForAgent = () => {
    if (hasPydanticSchema) {
      // To remove, we set pydanticSchema to undefined
      // Create a new object without pydanticSchema
      const { pydanticSchema, ...restData } = data; // Destructure to remove pydanticSchema
      updateNodeData(nodeId, { ...restData, pydanticSchema: undefined } as Partial<AgentNodeData>);
    } else {
      // To add, we initialize with a default structure
      updateNodeData(nodeId, { 
        pydanticSchema: { modelName: '', fields: [], description: '' } 
      } as Partial<AgentNodeData>);
    }
  };

  const handlePydanticSchemaChange = (field: keyof PydanticModelSchema, value: any) => {
    if (data.pydanticSchema) { // Should only be called if schema exists
      let validationResult = { valid: true, message: '' };
      if (field === 'modelName') {
        validationResult = isValidPythonIdentifier(value as string);
        setModelNameValidation(validationResult);
      }
      // Only update if UI validation passes or if we want to allow invalid input and let backend sanitize
      // For now, let's update always and show error, backend will sanitize.
      updateNodeData(nodeId, { 
        pydanticSchema: { ...data.pydanticSchema, [field]: value } 
      } as Partial<AgentNodeData>);
    }
  };

  const handlePydanticFieldChange = (fieldId: string, fieldProperty: keyof PydanticField, value: any) => {
    if (data.pydanticSchema) {
      let currentFieldValidation = { valid: true, message: '' };
      if (fieldProperty === 'name') {
        currentFieldValidation = isValidPythonIdentifier(value as string);
        setFieldNameValidations(prev => ({ ...prev, [fieldId]: currentFieldValidation }));
      }

      const updatedFields = data.pydanticSchema.fields.map(f => 
        f.id === fieldId ? { ...f, [fieldProperty]: value } : f
      );
      // Again, update store regardless of UI validation for now.
      updateNodeData(nodeId, { 
        pydanticSchema: { ...data.pydanticSchema, fields: updatedFields } 
      } as Partial<AgentNodeData>);
    }
  };

  const addPydanticField = () => {
    if (data.pydanticSchema) {
      const newFieldId = `pydantic-field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newField: PydanticField = {
        id: newFieldId,
        name: '',
        type: 'string',
        isOptional: false,
        description: ''
      };
      handlePydanticSchemaChange('fields', [...data.pydanticSchema.fields, newField]);
      // Initialize validation state for the new field
      setFieldNameValidations(prev => ({ ...prev, [newFieldId]: { valid: true, message: '' } }));
    }
  };

  const removePydanticField = (fieldId: string) => {
    if (data.pydanticSchema) {
      const updatedFields = data.pydanticSchema.fields.filter(f => f.id !== fieldId);
      handlePydanticSchemaChange('fields', updatedFields);
      // Remove validation state for the deleted field
      setFieldNameValidations(prev => {
        const { [fieldId]: _, ...rest } = prev;
        return rest;
      });
    }
  };
  
  // Effect to validate modelName on initial load or when data changes from store
  React.useEffect(() => {
    if (data.pydanticSchema?.modelName) {
      setModelNameValidation(isValidPythonIdentifier(data.pydanticSchema.modelName));
    } else {
      setModelNameValidation({ valid: true, message: '' }); // Reset if no model name
    }
  }, [data.pydanticSchema?.modelName]);

  // Effect to validate field names on initial load or when fields change
  React.useEffect(() => {
    if (data.pydanticSchema?.fields) {
      const newValidations: Record<string, { valid: boolean; message: string }> = {};
      data.pydanticSchema.fields.forEach(field => {
        newValidations[field.id] = isValidPythonIdentifier(field.name);
      });
      setFieldNameValidations(newValidations);
    } else {
      setFieldNameValidations({});
    }
  }, [data.pydanticSchema?.fields]);

  // START: Calculate connected tools and handoffs for properties panel
  const { connectedTools, connectedHandoffs } = React.useMemo(() => {
    const tools: string[] = [];
    const handoffs: string[] = [];

    if (!nodeId) return { connectedTools: tools, connectedHandoffs: handoffs };

    allEdges.forEach(edge => {
      // Find tools connected TO this agent
      if (edge.target === nodeId) {
        const sourceNode = allNodes.find(n => n.id === edge.source);
        if (sourceNode && sourceNode.data.nodeType === 'functionTool') {
          tools.push(sourceNode.data.name || 'Unnamed Tool');
        }
      }
      // Find handoffs FROM this agent
      if (edge.source === nodeId) {
        const targetNode = allNodes.find(n => n.id === edge.target);
        if (targetNode && targetNode.data.nodeType === 'agent') {
          handoffs.push(targetNode.data.name || 'Unnamed Agent');
        }
      }
    });
    return { connectedTools: tools, connectedHandoffs: handoffs };
  }, [nodeId, allNodes, allEdges]);
  // END: Calculate connected tools and handoffs for properties panel

  const pydanticFieldTypes: PydanticField['type'][] = ['string', 'number', 'boolean', 'list', 'dict'];

  return (
    <Box>
      <TextField
        label="名稱"
        value={data.name}
        onChange={(e) => handleChange('name', e.target.value)}
        {...commonTextFieldProps}
      />
      <TextField
        label="指示 (Instructions)"
        value={data.instructions}
        onChange={(e) => handleChange('instructions', e.target.value)}
        multiline
        rows={4}
        {...commonTextFieldProps}
      />
      <TextField
        label="Handoff 描述"
        value={data.handoff_description || ''}
        onChange={(e) => handleChange('handoff_description', e.target.value)}
        {...commonTextFieldProps}
      />
      <FormControlLabel
        control={<Switch checked={hasPydanticSchema} onChange={togglePydanticSchemaForAgent} />}
        label="使用 Pydantic 輸出模型"
        sx={{ mt: 2, mb: 1, display: 'block' }}
      />

      {hasPydanticSchema && data.pydanticSchema && (
        <Box sx={{ mt: 2, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Pydantic 模型配置
          </Typography>
          <TextField
            label="模型名稱 (Python Class Name)"
            value={data.pydanticSchema.modelName}
            onChange={(e) => handlePydanticSchemaChange('modelName', e.target.value)}
            {...commonTextFieldProps}
            error={!modelNameValidation.valid}
            helperText={modelNameValidation.valid ? "符合 Python 類別命名規範" : modelNameValidation.message}
          />
          <TextField
            label="模型描述 (Docstring)"
            value={data.pydanticSchema.description || ''}
            onChange={(e) => handlePydanticSchemaChange('description', e.target.value)}
            multiline
            rows={2}
            {...commonTextFieldProps}
          />

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
            模型字段
          </Typography>
          {data.pydanticSchema.fields.map((field, index) => (
            <Box key={field.id} sx={{ display: 'flex', flexDirection: 'column', mb: 2, p: 1.5, border: '1px solid #eee', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ mb: 1 }}>字段 {index + 1}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb:1 }}>
                <TextField
                  label="字段名稱"
                  value={field.name}
                  onChange={(e) => handlePydanticFieldChange(field.id, 'name', e.target.value)}
                  size="small"
                  variant="outlined"
                  sx={{ flexGrow: 1 }}
                  error={fieldNameValidations[field.id] ? !fieldNameValidations[field.id].valid : false}
                  helperText={fieldNameValidations[field.id] && !fieldNameValidations[field.id].valid ? fieldNameValidations[field.id].message : ''}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id={`pydantic-field-type-label-${field.id}`}>類型</InputLabel>
                  <Select
                    labelId={`pydantic-field-type-label-${field.id}`}
                    label="類型"
                    value={field.type}
                    onChange={(e: SelectChangeEvent<PydanticField['type']>) =>
                      handlePydanticFieldChange(field.id, 'type', e.target.value)
                    }
                  >
                    {pydanticFieldTypes.map(type => (
                      <MenuItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton onClick={() => removePydanticField(field.id)} color="error" size="small">
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                label="字段描述 (可選)"
                value={field.description || ''}
                onChange={(e) => handlePydanticFieldChange(field.id, 'description', e.target.value)}
                size="small"
                variant="outlined"
                fullWidth
                multiline
                minRows={1}
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={field.isOptional}
                    onChange={(e) => handlePydanticFieldChange(field.id, 'isOptional', e.target.checked)}
                    size="small"
                  />
                }
                label="可選 (Optional)"
                sx={{ alignSelf: 'flex-start', mt: 0 }}
              />
            </Box>
          ))}
          <Button
            startIcon={<AddCircleOutlineIcon />}
            onClick={addPydanticField}
            variant="outlined"
            size="small"
            sx={{ mt: 1 }}
          >
            新增字段
          </Button>
        </Box>
      )}

      {/* Display Connected Tools */}
      {connectedTools.length > 0 && (
        <Box sx={{ mt: 3, mb: 1 }}> {/* Increased mt for more spacing */}
          <Typography variant="subtitle1" sx={{ color: 'text.primary', mb: 1, fontWeight: 'medium' }}>
            已連接的 Function Tools
          </Typography>
          <List dense disablePadding sx={{ border: '1px solid #eee', borderRadius: 1, p:1 }}>
            {connectedTools.map((toolName, index) => (
              <ListItem key={`tool-${index}-${nodeId}`} sx={{ py: 0.5, px: 1 }}>
                <Typography variant="body2">- {toolName}</Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Display Connected Handoffs */}
      {connectedHandoffs.length > 0 && (
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', mb: 1, fontWeight: 'medium' }}>
            已連接的 Handoff Agents
          </Typography>
          <List dense disablePadding sx={{ border: '1px solid #eee', borderRadius: 1, p:1 }}>
            {connectedHandoffs.map((agentName, index) => (
              <ListItem key={`handoff-${index}-${nodeId}`} sx={{ py: 0.5, px: 1 }}>
                <Typography variant="body2">- {agentName}</Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

    </Box>
  );
};

/**
 * 渲染 Runner 節點的屬性表單。
 */
const RunnerProperties: React.FC<{ nodeId: string; data: RunnerNodeData }> = ({ nodeId, data }) => {
  const { updateNodeData } = useWorkflowStore();

  const handleChange = (field: keyof RunnerNodeData, value: any) => {
    updateNodeData(nodeId, { [field]: value } as Partial<RunnerNodeData>);
  };
  return (
  <Box>
    <TextField
      label="名稱"
      value={data.name}
      onChange={(e) => handleChange('name', e.target.value)}
      {...commonTextFieldProps}
    />
    <TextField
      label="輸入 (Input)"
      value={data.input}
      InputProps={{ readOnly: true }}
      multiline
      rows={2}
      helperText="此欄位自動帶入 Input 節點的訊息（由 workflow 起點決定）"
      {...commonTextFieldProps}
    />
    <FormControlLabel
      control={
        <Switch
          checked={data.execution_mode === 'async'}
          onChange={(e) => handleChange('execution_mode', e.target.checked ? 'async' : 'sync')}
        />
      }
      label="異步執行模式 (Async)"
      sx={{ mt: 1, mb: 1, display: 'block' }}
    />
    <TextField
      label="本地上下文 (Local Context)"
      value={data.context || ''}
      onChange={(e) => handleChange('context', e.target.value)}
      multiline
      rows={2} // Can adjust rows as needed
      {...commonTextFieldProps}
      helperText="輸入一個有效的 Python 表達式，它將作為 context 物件傳遞給 Runner (例如：{'key': 'value'} 或 YourContextClass(param='val'))。此 context 不會傳遞給 LLM。"
    />
  </Box>
)};

/**
 * 渲染 Function Tool 節點的屬性表單。
 */
const FunctionToolProperties: React.FC<{ nodeId: string; data: FunctionToolNodeData }> = ({ nodeId, data }) => {
  const { updateNodeData } = useWorkflowStore();

  // Handles changes for fields other than 'parameters'
  const handleChange = (field: keyof Omit<FunctionToolNodeData, 'parameters'>, value: any) => {
    updateNodeData(nodeId, { [field]: value } as Partial<FunctionToolNodeData>);
  };

  const handleAddParameter = () => {
    const newParameter: FunctionToolParameter = {
      id: `param-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Simple unique ID
      name: '',
      type: 'string', // Default type
    };
    const newParameters = [...data.parameters, newParameter];
    updateNodeData(nodeId, { parameters: newParameters });
  };

  const handleRemoveParameter = (parameterId: string) => {
    const newParameters = data.parameters.filter(p => p.id !== parameterId);
    updateNodeData(nodeId, { parameters: newParameters });
  };

  const handleParameterDetailChange = (
    parameterId: string,
    field: keyof FunctionToolParameter,
    value: string
  ) => {
    const newParameters = data.parameters.map(p =>
      p.id === parameterId ? { ...p, [field]: value } : p
    );
    updateNodeData(nodeId, { parameters: newParameters });
  };

  // Handler for Monaco Editor change
  const handleEditorChange = (value: string | undefined) => {
    handleChange('implementation', value || '');
  };

  const parameterTypes: FunctionToolParameter['type'][] = ['string', 'number', 'boolean', 'list', 'dict'];

  return (
  <Box>
    <TextField
      label="名稱"
      value={data.name}
      onChange={(e) => handleChange('name', e.target.value)}
      {...commonTextFieldProps}
    />
    <TextField
      label="描述 (Description)"
      value={data.description || ''}
      onChange={(e) => handleChange('description', e.target.value)}
      multiline
      rows={3}
      {...commonTextFieldProps}
    />

    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
      參數
    </Typography>
    {data.parameters.map((param, index) => (
      <Box key={param.id} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
        <TextField
          label={`參數 ${index + 1} 名稱`}
          value={param.name}
          onChange={(e) => handleParameterDetailChange(param.id, 'name', e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
          variant="outlined"
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id={`param-type-label-${param.id}`}>類型</InputLabel>
          <Select
            labelId={`param-type-label-${param.id}`}
            label="類型"
            value={param.type}
            onChange={(e: SelectChangeEvent<FunctionToolParameter['type']>) =>
              handleParameterDetailChange(param.id, 'type', e.target.value)
            }
          >
            {parameterTypes.map(type => (
              <MenuItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton onClick={() => handleRemoveParameter(param.id)} color="error" size="small">
          <DeleteIcon />
        </IconButton>
      </Box>
    ))}
    <Button
      startIcon={<AddCircleOutlineIcon />}
      onClick={handleAddParameter}
      variant="outlined"
      size="small"
      sx={{ mt: 1 }}
    >
      新增參數
    </Button>

    <FormControl {...commonTextFieldProps} sx={{ mt: 2, mb: 1 }}>
      <InputLabel id={`return-type-label-${nodeId}`}>返回類型</InputLabel>
      <Select
        labelId={`return-type-label-${nodeId}`}
        label="返回類型"
        value={data.returnType}
        onChange={(e: SelectChangeEvent<FunctionToolNodeData['returnType']>) => handleChange('returnType', e.target.value)}
      >
        <MenuItem value="string">String</MenuItem>
        <MenuItem value="number">Number</MenuItem>
        <MenuItem value="boolean">Boolean</MenuItem>
        <MenuItem value="list">List</MenuItem>
        <MenuItem value="dict">Dict</MenuItem>
        <MenuItem value="none">None</MenuItem>
      </Select>
    </FormControl>
    
    <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5, color: 'text.secondary' }}>
      實現 (Implementation)
    </Typography>
    <Box sx={{ 
      border: '1px solid rgba(255, 255, 255, 0.23)', 
      borderRadius: '4px', 
      padding: '1px', 
      marginBottom: commonTextFieldProps.margin === 'normal' ? '16px' : '8px'
    }}>
      <Editor
        height="200px"
        language="python"
        theme="vs-dark"
        value={data.implementation || ''}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true
        }}
      />
    </Box>
  </Box>
)};

/**
 * 渲染 Input 節點的屬性表單。
 */
const InputProperties: React.FC<{ nodeId: string; data: InputNodeData }> = ({ nodeId, data }) => {
  const { updateInputMessageAndSyncRunners } = useWorkflowStore();
  const handleChange = (field: keyof InputNodeData, value: any) => {
    if (field === 'message') {
      updateInputMessageAndSyncRunners(nodeId, value);
    } else {
      // 其他欄位仍用 updateNodeData
      useWorkflowStore.getState().updateNodeData(nodeId, { [field]: value } as Partial<InputNodeData>);
    }
  };
  return (
    <Box>
      <TextField
        label="名稱"
        value={data.name}
        onChange={(e) => handleChange('name', e.target.value)}
        {...commonTextFieldProps}
      />
      <TextField
        label="用戶訊息 (Message)"
        value={data.message}
        onChange={(e) => handleChange('message', e.target.value)}
        multiline
        rows={3}
        {...commonTextFieldProps}
      />
      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
        這是 workflow 的起點，訊息將傳遞給第一個 Agent。
      </Typography>
    </Box>
  );
};

/**
 * Renders the properties form for a Guardrail node.
 */
const GuardrailProperties: React.FC<{ nodeId: string; data: GuardrailNodeData }> = ({ nodeId, data }) => {
  const { updateNodeData } = useWorkflowStore();

  const [modelNameValidation, setModelNameValidation] = React.useState<{ valid: boolean; message: string }>({ valid: true, message: '' });
  const [fieldNameValidations, setFieldNameValidations] = React.useState<Record<string, { valid: boolean; message: string }>>({});

  const handleChange = (field: keyof GuardrailNodeData, value: any) => {
    if (field === 'guardrailType') {
        updateNodeData(nodeId, { [field]: value as GuardrailType } as Partial<GuardrailNodeData>);
    } else {
        updateNodeData(nodeId, { [field]: value } as Partial<GuardrailNodeData>);
    }
  };

  const handlePydanticSchemaChange = (field: keyof PydanticModelSchema, value: any) => {
    const currentSchema = data.internalAgentPydanticSchema || { modelName: '', fields: [], description: '' };
    let validationResult = { valid: true, message: '' };
    if (field === 'modelName') {
      validationResult = isValidPythonIdentifier(value as string);
      setModelNameValidation(validationResult);
    }
    updateNodeData(nodeId, {
      internalAgentPydanticSchema: { ...currentSchema, [field]: value }
    } as Partial<GuardrailNodeData>);
  };

  const handlePydanticFieldChange = (fieldId: string, fieldProperty: keyof PydanticField, value: any) => {
    const currentSchema = data.internalAgentPydanticSchema || { modelName: '', fields: [], description: '' };
    let currentFieldValidation = { valid: true, message: '' };
    if (fieldProperty === 'name') {
      currentFieldValidation = isValidPythonIdentifier(value as string);
      setFieldNameValidations(prev => ({ ...prev, [fieldId]: currentFieldValidation }));
    }
    const updatedFields = (currentSchema.fields || []).map(f =>
      f.id === fieldId ? { ...f, [fieldProperty]: value } : f
    );
    updateNodeData(nodeId, {
      internalAgentPydanticSchema: { ...currentSchema, fields: updatedFields }
    } as Partial<GuardrailNodeData>);
  };

  const addPydanticField = () => {
    const currentSchema = data.internalAgentPydanticSchema || { modelName: '', fields: [], description: '' };
    const newFieldId = `pydantic-field-guardrail-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newField: PydanticField = {
      id: newFieldId,
      name: '',
      type: 'string',
      isOptional: false,
      description: ''
    };
    handlePydanticSchemaChange('fields', [...(currentSchema.fields || []), newField]);
    setFieldNameValidations(prev => ({ ...prev, [newFieldId]: { valid: true, message: '' } }));
  };

  const removePydanticField = (fieldId: string) => {
    const currentSchema = data.internalAgentPydanticSchema || { modelName: '', fields: [], description: '' };
    const updatedFields = (currentSchema.fields || []).filter(f => f.id !== fieldId);
    handlePydanticSchemaChange('fields', updatedFields);
    setFieldNameValidations(prev => {
      const { [fieldId]: _, ...rest } = prev;
      return rest;
    });
  };

  // Effect to validate modelName on initial load or when data changes from store
  React.useEffect(() => {
    if (data.internalAgentPydanticSchema?.modelName) {
      setModelNameValidation(isValidPythonIdentifier(data.internalAgentPydanticSchema.modelName));
    } else {
      setModelNameValidation({ valid: true, message: '' });
    }
  }, [data.internalAgentPydanticSchema?.modelName]);

  // Effect to validate field names on initial load or when fields change
  React.useEffect(() => {
    if (data.internalAgentPydanticSchema?.fields) {
      const newValidations: Record<string, { valid: boolean; message: string }> = {};
      data.internalAgentPydanticSchema.fields.forEach(field => {
        newValidations[field.id] = isValidPythonIdentifier(field.name);
      });
      setFieldNameValidations(newValidations);
    } else {
      setFieldNameValidations({});
    }
  }, [data.internalAgentPydanticSchema?.fields]);

  const pydanticFieldTypes: PydanticField['type'][] = ['string', 'number', 'boolean', 'list', 'dict'];
  const hasInternalPydanticSchema = !!data.internalAgentPydanticSchema;

  const toggleInternalPydanticSchema = () => {
    if (hasInternalPydanticSchema) {
        updateNodeData(nodeId, { internalAgentPydanticSchema: undefined } as Partial<GuardrailNodeData>);
    } else {
        updateNodeData(nodeId, { 
            internalAgentPydanticSchema: { modelName: '', fields: [], description: '' } 
        } as Partial<GuardrailNodeData>);
    }
  };

  return (
    <Box>
      <TextField
        label="名稱 (Guardrail Name)"
        value={data.name}
        onChange={(e) => handleChange('name', e.target.value)}
        {...commonTextFieldProps}
      />
      <TextField
        label="描述 (Description)"
        value={data.description || ''}
        onChange={(e) => handleChange('description', e.target.value)}
        multiline
        rows={2}
        {...commonTextFieldProps}
      />
      <FormControl {...commonTextFieldProps} sx={{ mt: 2, mb: 1 }}>
        <InputLabel id={`guardrail-type-label-${nodeId}`}>Guardrail 類型</InputLabel>
        <Select
          labelId={`guardrail-type-label-${nodeId}`}
          label="Guardrail 類型"
          value={data.guardrailType}
          onChange={(e: SelectChangeEvent<GuardrailType>) => handleChange('guardrailType', e.target.value as GuardrailType)}
        >
          <MenuItem value={GuardrailType.INPUT}>輸入型 (Input)</MenuItem>
          <MenuItem value={GuardrailType.OUTPUT}>輸出型 (Output)</MenuItem>
        </Select>
      </FormControl>

      <Divider sx={{ my: 2 }}><Typography variant="overline">內部檢查 Agent 設定</Typography></Divider>

      <TextField
        label="內部 Agent 名稱"
        value={data.internalAgentName}
        onChange={(e) => handleChange('internalAgentName', e.target.value)}
        {...commonTextFieldProps}
      />
      <TextField
        label="內部 Agent 指示"
        value={data.internalAgentInstructions}
        onChange={(e) => handleChange('internalAgentInstructions', e.target.value)}
        multiline
        rows={3}
        {...commonTextFieldProps}
      />

      <FormControlLabel
        control={<Switch checked={hasInternalPydanticSchema} onChange={toggleInternalPydanticSchema} />}
        label="內部 Agent 使用 Pydantic 輸出模型"
        sx={{ mt: 1, mb:1 }}
      />

      {hasInternalPydanticSchema && data.internalAgentPydanticSchema && (
         <Box sx={{ mt: 1, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            內部 Agent Pydantic 模型配置
          </Typography>
          <TextField
            label="模型名稱 (Python Class Name)"
            value={data.internalAgentPydanticSchema.modelName}
            onChange={(e) => handlePydanticSchemaChange('modelName', e.target.value)}
            {...commonTextFieldProps}
            error={!modelNameValidation.valid}
            helperText={modelNameValidation.valid ? "符合 Python 類別命名規範" : modelNameValidation.message}
          />
          <TextField
            label="模型描述 (Docstring)"
            value={data.internalAgentPydanticSchema.description || ''}
            onChange={(e) => handlePydanticSchemaChange('description', e.target.value)}
            multiline
            rows={2}
            {...commonTextFieldProps}
          />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
            模型字段
          </Typography>
          {data.internalAgentPydanticSchema.fields.map((field, index) => (
            <Box key={field.id} sx={{ display: 'flex', flexDirection: 'column', mb: 2, p: 1.5, border: '1px solid #eee', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ mb: 1 }}>字段 {index + 1}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb:1 }}>
                <TextField
                  label="字段名稱"
                  value={field.name}
                  onChange={(e) => handlePydanticFieldChange(field.id, 'name', e.target.value)}
                  size="small"
                  variant="outlined"
                  sx={{ flexGrow: 1 }}
                  error={fieldNameValidations[field.id] ? !fieldNameValidations[field.id].valid : false}
                  helperText={fieldNameValidations[field.id] && !fieldNameValidations[field.id].valid ? fieldNameValidations[field.id].message : ''}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id={`pydantic-field-type-label-guardrail-${field.id}`}>類型</InputLabel>
                  <Select
                    labelId={`pydantic-field-type-label-guardrail-${field.id}`}
                    label="類型"
                    value={field.type}
                    onChange={(e: SelectChangeEvent<PydanticField['type']>) =>
                      handlePydanticFieldChange(field.id, 'type', e.target.value)
                    }
                  >
                    {pydanticFieldTypes.map(type => (
                      <MenuItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton onClick={() => removePydanticField(field.id)} color="error" size="small">
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                label="字段描述 (可選)"
                value={field.description || ''}
                onChange={(e) => handlePydanticFieldChange(field.id, 'description', e.target.value)}
                size="small"
                variant="outlined"
                fullWidth
                multiline
                minRows={1}
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={field.isOptional}
                    onChange={(e) => handlePydanticFieldChange(field.id, 'isOptional', e.target.checked)}
                    size="small"
                  />
                }
                label="可選 (Optional)"
                sx={{ alignSelf: 'flex-start', mt: 0 }}
              />
            </Box>
          ))}
          <Button
            startIcon={<AddCircleOutlineIcon />}
            onClick={addPydanticField}
            variant="outlined"
            size="small"
            sx={{ mt: 1 }}
          >
            新增字段
          </Button>
        </Box>
      )}

      <Divider sx={{ my: 2 }}><Typography variant="overline">觸發條件</Typography></Divider>
      <TextField
        label="觸發條件邏輯 (Tripwire Condition)"
        value={data.tripwireConditionLogic}
        onChange={(e) => handleChange('tripwireConditionLogic', e.target.value)}
        multiline
        rows={2}
        {...commonTextFieldProps}
        helperText="例如：output.is_homework == True 或 result.final_output.is_math_homework (基於內部 Agent 的 Pydantic 輸出)"
      />
    </Box>
  );
};

/**
 * 屬性編輯面板，顯示並編輯選中節點的屬性。
 */
const PropertiesPanel: React.FC = () => {
  const { selectedNodeId, nodes } = useWorkflowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) as Node<CustomNodeData> | undefined;

  if (!selectedNode) {
    return <Box sx={{ p: 2, color: 'text.secondary' }}>請選擇一個節點以編輯其屬性。</Box>;
  }

  const renderProperties = () => {
    if (!selectedNode.data || !selectedNode.id) return null;
    const { id, data } = selectedNode;

    switch (data.nodeType) {
      case 'agent':
        return <AgentProperties nodeId={id} data={data as AgentNodeData} />;
      case 'runner':
        return <RunnerProperties nodeId={id} data={data as RunnerNodeData} />;
      case 'functionTool':
        return <FunctionToolProperties nodeId={id} data={data as FunctionToolNodeData} />;
      case 'input':
        return <InputProperties nodeId={id} data={data as InputNodeData} />;
      case 'guardrail':
        return <GuardrailProperties nodeId={id} data={data as GuardrailNodeData} />;
      default:
        console.error('Unknown node type in PropertiesPanel:', data);
        return (
          <TextField
            label="錯誤"
            value={`未知節點類型: ${(data as any)?.nodeType}`}
            disabled
            {...commonTextFieldProps}
          />
        );
    }
  };

  return (
    <Box sx={{ p: 2 }} key={selectedNode.id}>
      <Typography variant="h6" gutterBottom component="div" sx={{ mb: 2 }}>
        屬性面板: {(selectedNode.data as NodeBaseData)?.name || '未命名'}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {renderProperties()}
    </Box>
  );
};

export default PropertiesPanel;
