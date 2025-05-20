import { Node, Edge } from 'reactflow';
import { CustomNodeData, FunctionToolNodeData, FunctionToolParameter, AgentNodeData, RunnerNodeData, PydanticModelSchema, PydanticField, GuardrailNodeData, GuardrailType } from '../types/workflowNodes';

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import',
  'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while',
  'with', 'yield'
]);

function generatePythonIdentifier(
  baseName: string,
  typePrefix: string, 
  existingNames: Set<string>,
  nodeId: string 
): string {
  let name = baseName.trim() || `${typePrefix}_${nodeId.substring(0, 8).replace(/[^a-zA-Z0-9_]/g, '')}`;

  name = name.toLowerCase();
  name = name.replace(/\s+/g, '_');
  name = name.replace(/[^a-z0-9_]/g, '');
  name = name.replace(/^_+|_+$/g, '');

  if (/^[0-9]/.test(name)) {
    name = `_${name}`;
  }

  if (name === '' || name === '_' || PYTHON_KEYWORDS.has(name)) {
    name = `${typePrefix}_${nodeId.replace(/[^a-zA-Z0-9]/g, '')}`.substring(0,15); // Ensure fallback is also sanitized and reasonably short
    if (/^[0-9]/.test(name)) {
        name = `_${name}`;
    }
  }
  // Fallback if name is still empty after sanitization (e.g. nodeId contained only invalid chars)
  if (name === '' || name === '_'){
      name = `${typePrefix}_fallback`;
  }


  let finalName = name;
  let counter = 1;
  const originalName = name;
  while (existingNames.has(finalName)) {
    finalName = `${originalName}_${counter}`;
    counter++;
  }
  existingNames.add(finalName);
  return finalName;
}

/**
 * Helper function to convert basic TypeScript types to Python type hints.
 */
function mapTsTypeToPython(tsType: FunctionToolParameter['type'] | FunctionToolNodeData['returnType']): string {
  switch (tsType) {
    case 'string':
      return 'str';
    case 'number':
      return 'int'; 
    case 'boolean':
      return 'bool';
    case 'list':
      return 'list'; 
    case 'dict':
      return 'dict'; 
    case 'none': 
      return 'None';
    default:
      return 'Any'; 
  }
}

// New helper function for Pydantic field types
function mapPydanticFieldTypeToPython(fieldType: PydanticField['type']): string {
  switch (fieldType) {
    case 'string':
      return 'str';
    case 'number':
      return 'float'; // Pydantic typically uses float for general numbers
    case 'boolean':
      return 'bool';
    case 'list':
      return 'List'; // Will require 'from typing import List'
    case 'dict':
      return 'Dict'; // Will require 'from typing import Dict, Any'
    default:
      return 'Any'; // Will require 'from typing import Any'
  }
}

// New function to generate Pydantic model Python code
function generatePydanticModelPythonCode(
  schema: PydanticModelSchema,
  modelPythonName: string, // Already sanitized and unique
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _globalPythonIdentifiers: Set<string> 
): string {
  let modelCode = `class ${modelPythonName}(BaseModel):\n`;
  
  // Add model docstring if description exists
  if (schema.description && schema.description.trim()) {
    const descriptionLines = schema.description.trim().split('\n');
    if (descriptionLines.length === 1) {
      modelCode += `    """${descriptionLines[0]}"""\n`;
    } else {
      modelCode += `    """\n${descriptionLines.map(line => `    ${line.trim()}`).join('\n')}\n    """\n`;
    }
  }

  if (schema.fields.length === 0) {
    modelCode += '    pass\n';
  } else {
    const modelFieldNames = new Set<string>(); // For field name uniqueness within this model
    schema.fields.forEach(field => {
      const fieldName = generatePythonIdentifier(field.name, 'field', modelFieldNames, field.id);
      
      const pyType = mapPydanticFieldTypeToPython(field.type);
      
      let fieldDefinition = `    ${fieldName}: `;
      if (field.isOptional) {
        fieldDefinition += `Optional[${pyType}] = None`;
      } else {
        fieldDefinition += pyType;
      }
      
      // Add field description as a comment if it exists
      if (field.description && field.description.trim()) {
        // Ensure the comment is properly indented and handles multi-line descriptions for comments if necessary
        const fieldDescLines = field.description.trim().split('\n');
        if (fieldDescLines.length === 1) {
            fieldDefinition += `  # ${fieldDescLines[0]}`;
        } else {
            // For multi-line comments on a field, Pydantic/Python typically still expects it on one line or use a separate docstring for the field if supported
            // Sticking to a single line comment for simplicity here, joining multi-lines with a space.
            fieldDefinition += `  # ${fieldDescLines.join(' ')}`;
        }
      }
      modelCode += `${fieldDefinition}\n`;
    });
  }
  
  modelCode += '\n';
  return modelCode;
}

/**
 * 根據節點與連線生成 Python 代碼。
 *
 * Args:
 *   nodes: 畫布上的所有節點
 *   edges: 畫布上的所有連線
 *   workflowName?: Optional workflow name
 *   workflowDescription?: Optional workflow description
 *
 * Returns:
 *   格式化後的 Python 代碼字串
 */
export function generatePythonCode(
  nodes: Node<CustomNodeData>[], 
  edges: Edge[],
  workflowName?: string, // Optional workflow name
  workflowDescription?: string // Optional workflow description
): string {
  let workflowMetadataComment = '';
  if (workflowName && workflowName.trim() !== '') {
    workflowMetadataComment += `# Workflow Name: ${workflowName.trim()}\n`;
  }
  if (workflowDescription && workflowDescription.trim() !== '') {
    workflowMetadataComment += `# Workflow Description: ${workflowDescription.trim().replace(/\n/g, '\n#                   ')}\n`; // Indent multi-line descriptions
  }
  if (workflowMetadataComment) {
    workflowMetadataComment += '\n'; // Add a newline after metadata if it exists
  }

  const utf8Header = '# -*- coding: utf-8 -*-\n\n';

  // console.log('[CodeGen Entry] Nodes:', JSON.stringify(nodes, null, 2)); // Kept as removed
  // console.log('[CodeGen Entry] Edges:', JSON.stringify(edges, null, 2)); // Kept as removed

  let imports = 'from agents import Agent, Runner, function_tool, AssistantMessage\n';
  imports += 'from agents import InputGuardrail, GuardrailFunctionOutput, output_guardrail, input_guardrail, RunContextWrapper\n';
  imports += 'from pydantic import BaseModel\n';
  // Add typing imports - ensure all necessary ones are covered
  imports += 'from typing import Optional, List, Dict, Any\n'; 
  imports += 'import asyncio\n\n';

  const pythonIdentifiers = new Set<string>();
  const functionToolNames = new Map<string, string>();
  const agentVariableNames = new Map<string, string>();
  const pydanticModelInfo = new Map<string, { pyName: string, schema: PydanticModelSchema }>();
  const guardrailInternalAgentVarNames = new Map<string, string>();
  const guardrailFunctionNames = new Map<string, string>();

  // Phase 1: Pre-compute unique Python identifiers
  nodes.forEach(node => {
    if (node.data.nodeType === 'functionTool') {
      const funcName = generatePythonIdentifier(node.data.name, 'tool', pythonIdentifiers, node.id);
      functionToolNames.set(node.id, funcName);
    } else if (node.data.nodeType === 'agent') {
      const agentVarName = generatePythonIdentifier(node.data.name, 'agent', pythonIdentifiers, node.id);
      agentVariableNames.set(node.id, agentVarName);
      
      // Phase 1.5: Pre-compute unique Python identifiers for Pydantic models associated with Agents
      const agentData = node.data as AgentNodeData;
      if (agentData.pydanticSchema && agentData.pydanticSchema.modelName) {
        const originalModelName = agentData.pydanticSchema.modelName;
        if (!pydanticModelInfo.has(originalModelName)) {
          const modelPyName = generatePythonIdentifier(originalModelName, 'model', pythonIdentifiers, node.id + '_model');
          pydanticModelInfo.set(originalModelName, { pyName: modelPyName, schema: agentData.pydanticSchema });
        }
      }
    } else if (node.data.nodeType === 'guardrail') {
      const guardrailData = node.data as GuardrailNodeData;
      const internalAgentVarName = generatePythonIdentifier(guardrailData.internalAgentName, 'guard_agent', pythonIdentifiers, node.id + '_internal_agent');
      guardrailInternalAgentVarNames.set(node.id, internalAgentVarName);

      const guardrailFuncName = generatePythonIdentifier(guardrailData.name, 'guard_func', pythonIdentifiers, node.id + '_guard_func');
      guardrailFunctionNames.set(node.id, guardrailFuncName);

      if (guardrailData.internalAgentPydanticSchema && guardrailData.internalAgentPydanticSchema.modelName) {
        const originalModelName = guardrailData.internalAgentPydanticSchema.modelName;
        if (!pydanticModelInfo.has(originalModelName)) {
          const modelPyName = generatePythonIdentifier(originalModelName, 'guard_model', pythonIdentifiers, node.id + '_internal_model');
          pydanticModelInfo.set(originalModelName, { pyName: modelPyName, schema: guardrailData.internalAgentPydanticSchema });
        }
      }
    }
  });
  
  let pydanticModelsCode = '';
  // Generate Pydantic model definitions first
  pydanticModelInfo.forEach(({ pyName, schema }) => {
    pydanticModelsCode += generatePydanticModelPythonCode(schema, pyName, pythonIdentifiers); // Pass global pythonIdentifiers for context if needed by internal calls, though field names are local
  });
  if (pydanticModelsCode) {
    pydanticModelsCode += '\n'; // Add a newline after all model definitions
  }

  let functionToolCode = '';
  nodes.forEach(node => {
    if (node.data.nodeType === 'functionTool') {
      const toolData = node.data as FunctionToolNodeData;
      const funcName = functionToolNames.get(node.id) || 'error_tool_name'; // Should always be found
      
      const params = toolData.parameters.map(p => {
        const paramName = generatePythonIdentifier(p.name, 'param', new Set(), p.id); // Param names are local to function, so new Set
        return `${paramName}: ${mapTsTypeToPython(p.type)}`;
      }).join(', ');
      
      const returnTypeHint = mapTsTypeToPython(toolData.returnType);
      
      let funcDef = `@function_tool\n`;
      funcDef += `def ${funcName}(${params}) -> ${returnTypeHint}:\n`;

      let docstringBlock = '';
      if (toolData.description) {
        const descriptionLines = toolData.description.trim().split('\n');
        if (descriptionLines.length === 1 && toolData.description.length > 0) {
          docstringBlock = `    """${descriptionLines[0]}"""\n`;
        } else if (descriptionLines.length > 1) {
          docstringBlock = `    """\n${descriptionLines.map(line => `    ${line.trim()}`).join('\n')}\n    """\n`;
        }
      }

      let implementationBlock = '';
      if (toolData.implementation && toolData.implementation.trim() !== '') {
        implementationBlock = toolData.implementation.trimEnd().split('\n').map(line => `    ${line}`).join('\n') + '\n';
      } else {
        implementationBlock = '    pass\n';
      }

      functionToolCode += funcDef;
      if (docstringBlock) {
        functionToolCode += docstringBlock;
      }
      functionToolCode += implementationBlock;
      functionToolCode += '\n\n'; 
    }
  });

  let guardrailDefinitionsCode = '';
  nodes.forEach(node => {
    if (node.data.nodeType === 'guardrail') {
      const guardrailData = node.data as GuardrailNodeData;
      const internalAgentPyName = guardrailInternalAgentVarNames.get(node.id);
      const guardrailFuncPyName = guardrailFunctionNames.get(node.id);

      if (internalAgentPyName && guardrailFuncPyName) {
        guardrailDefinitionsCode += generateGuardrailPythonCode(
          guardrailData,
          internalAgentPyName,
          guardrailFuncPyName,
          pydanticModelInfo,
          pythonIdentifiers,
          node.id
        );
      } else {
        console.warn(`Could not find pre-computed names for guardrail ${guardrailData.name} (ID: ${node.id})`);
      }
    }
  });

  let agentCode = '';
  nodes.forEach(node => {
    if (node.data.nodeType === 'agent') {
      const agentData = node.data as AgentNodeData;
      const agentDisplayName = agentData.name || 'My Agent'; 
      const agentVariableName = agentVariableNames.get(node.id) || 'error_agent_var_name'; 
      
      let tempAgentCode = `# Agent: ${agentDisplayName} (variable: ${agentVariableName})\n`;
      tempAgentCode += `${agentVariableName} = Agent(\n`;
      tempAgentCode += `    name="${agentVariableName}",\n`;
      tempAgentCode += `    instructions="""${agentData.instructions || 'No instructions provided.'}""",\n`;

      const tools: string[] = [];
      edges.forEach(edge => {
        // If the current agent is the TARGET of an edge, and the SOURCE is a Function Tool
        if (edge.target === node.id) { 
          const sourceNode = nodes.find(n => n.id === edge.source);
          
          if (sourceNode && sourceNode.data.nodeType === 'functionTool') {
            const toolName = functionToolNames.get(sourceNode.id); // Get name of the source node (the tool)
            if (toolName) {
              tools.push(toolName);
            }
          }
        }
      });
      tempAgentCode += `    tools=[${tools.join(', ')}],\n`;

      const handoffTargetVarNames = new Set<string>();
      edges.forEach(edge => {
        if (edge.source === node.id) {
          const targetNode = nodes.find(n => n.id === edge.target);
          if (targetNode && targetNode.data.nodeType === 'agent' && targetNode.id !== node.id) {
            const targetAgentVarName = agentVariableNames.get(targetNode.id);
            if (targetAgentVarName) handoffTargetVarNames.add(`"${targetAgentVarName}"`);
          }
        }
      });
      tempAgentCode += `    handoffs=[${Array.from(handoffTargetVarNames).join(', ')}]`;
      
      // Add output_type if defined, using the correct parameter name from SDK documentation
      if (agentData.pydanticSchema && agentData.pydanticSchema.modelName) {
        const modelInfo = pydanticModelInfo.get(agentData.pydanticSchema.modelName);
        if (modelInfo) {
          tempAgentCode += `,\n    output_type=${modelInfo.pyName}`;
        }
      }

      // START: Add input_guardrails and output_guardrails
      const inputGuardrailNamesPy: string[] = [];
      const outputGuardrailNamesPy: string[] = [];

      edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        // Guardrail pointing to this Agent
        if (targetNode && targetNode.id === node.id && sourceNode && sourceNode.data.nodeType === 'guardrail') {
          const guardrailData = sourceNode.data as GuardrailNodeData;
          const guardrailFuncName = guardrailFunctionNames.get(sourceNode.id);
          if (guardrailFuncName) {
            if (guardrailData.guardrailType === GuardrailType.INPUT) {
              inputGuardrailNamesPy.push(guardrailFuncName);
            } else if (guardrailData.guardrailType === GuardrailType.OUTPUT) {
              // Note: SDK OutputGuardrail is called *after* agent execution.
              // An edge from Guardrail to Agent might not be the most intuitive for OUTPUT.
              // However, we'll stick to this connection logic for now.
              // Alternative: Agent points to Output Guardrail, or no direct edge, just association in properties.
              outputGuardrailNamesPy.push(guardrailFuncName);
            }
          }
        }
        // This part is more complex: How does an Agent declare an Output Guardrail it uses?
        // The SDK has agent.output_guardrails = [my_output_guard_func]
        // For now, we assume if a guardrail of type OUTPUT has an edge *to* the agent, it's an output guardrail.
        // This might need refinement based on desired UX for connecting output guardrails.
      });
      
      // Remove duplicates that might arise if multiple handles connect the same guardrail
      const uniqueInputGuardrails = Array.from(new Set(inputGuardrailNamesPy));
      const uniqueOutputGuardrails = Array.from(new Set(outputGuardrailNamesPy));

      if (uniqueInputGuardrails.length > 0) {
        tempAgentCode += `,\n    input_guardrails=[${uniqueInputGuardrails.join(', ')}]`;
      }
      if (uniqueOutputGuardrails.length > 0) {
        tempAgentCode += `,\n    output_guardrails=[${uniqueOutputGuardrails.join(', ')}]`;
      }
      // END: Add input_guardrails and output_guardrails

      if (agentData.handoff_description) {
        tempAgentCode += `,\n    # Handoff Description: ${agentData.handoff_description.replace(/\n/g, ' ')}`;
      }
      tempAgentCode += `\n)\n\n`;
      agentCode += tempAgentCode; // Add the constructed code for this agent
    }
  });

  let runnerExecutionInvocations = '';
  let hasAsyncRunner = false;

  nodes.forEach(node => {
    if (node.data.nodeType === 'runner') {
      const runnerData = node.data as RunnerNodeData;
      let connectedAgentVariableName: string | null = null;

      const incomingEdge = edges.find(edge => edge.target === node.id);
      if (incomingEdge) {
        const sourceNode = nodes.find(n => n.id === incomingEdge.source);
        if (sourceNode && sourceNode.data.nodeType === 'agent') {
          connectedAgentVariableName = agentVariableNames.get(sourceNode.id) || null;
        }
      }

      if (connectedAgentVariableName) {
        const runnerInput = runnerData.input || "";
        const sanitizedInput = runnerInput.replace(/"""/g, '\\"""').replace(/`/g, '\\`');

        const firstLineOfInput = sanitizedInput.split('\n')[0];
        
        let contextArgument = '';
        if (runnerData.context && runnerData.context.trim() !== '') {
          // Assuming runnerData.context is a string representing a valid Python expression
          contextArgument = `, context=${runnerData.context.trim()}`;
        }

        if (runnerData.execution_mode === 'async') {
          hasAsyncRunner = true;
          runnerExecutionInvocations += `    print(f"Executing ${connectedAgentVariableName} asynchronously with input: ${firstLineOfInput}...")\n`;
          runnerExecutionInvocations += `    response = await ${connectedAgentVariableName}.run_async(input=\"""${sanitizedInput}\"""${contextArgument})${'\n'}`;
          runnerExecutionInvocations += `    print(f"Response from ${connectedAgentVariableName}: {response}")${'\n'}`;
        } else {
          runnerExecutionInvocations += `    print(f"Executing ${connectedAgentVariableName} synchronously with input: ${firstLineOfInput}...")\n`;
          runnerExecutionInvocations += `    response = ${connectedAgentVariableName}.run(input=\"""${sanitizedInput}\"""${contextArgument})${'\n'}`;
          runnerExecutionInvocations += `    print(f"Response from ${connectedAgentVariableName}: {response}")${'\n'}`;
        }
      } else {
        runnerExecutionInvocations += `    # Runner node "${runnerData.name || 'Unnamed Runner'}" is not correctly connected to an Agent.\n`;
      }
    }
  });
  
  let mainExecutionBlock = '';
  if (runnerExecutionInvocations.trim() !== '') {
    if (hasAsyncRunner) {
      mainExecutionBlock = 'async def main():\n';
      mainExecutionBlock += runnerExecutionInvocations;
      mainExecutionBlock += '\n\nif __name__ == "__main__":\n';
      mainExecutionBlock += '    asyncio.run(main())\n';
    } else {
      mainExecutionBlock = 'def main():\n';
      mainExecutionBlock += runnerExecutionInvocations;
      mainExecutionBlock += '\n\nif __name__ == "__main__":\n';
      mainExecutionBlock += '    main()\n';
    }
  }

  let finalCode = imports; // Start with imports

  // Add Pydantic models (if they exist)
  // This ensures Pydantic models are defined before they are referenced.
  if (pydanticModelsCode.trim() !== '') {
    finalCode += pydanticModelsCode; 
  }

  // Add Function Tools
  if (functionToolCode.trim() !== '') {
    finalCode += '# Function Tools\n';
    finalCode += functionToolCode;
  }

  // Add Guardrail Definitions (which includes internal agent instantiations that might use Pydantic models)
  if (guardrailDefinitionsCode.trim() !== '') {
    finalCode += '# Guardrail Definitions\n';
    finalCode += guardrailDefinitionsCode;
  }

  // Add Agents (which might use Pydantic models for output_type)
  if (agentCode.trim() !== '') {
    finalCode += '# Agents\n';
    finalCode += agentCode;
  }
  
  // Add Main Execution Block
  if (mainExecutionBlock.trim() !== '') {
    finalCode += '# Main Execution\n';
    finalCode += mainExecutionBlock;
  }
  
  // Check if any "executable" parts of the workflow were generated.
  // Pydantic models are definitions, not executable elements in this context.
  const hasExecutableElements = 
      functionToolCode.trim() !== '' ||
      guardrailDefinitionsCode.trim() !== '' || // Guardrail functions and their internal agents
      agentCode.trim() !== '' || // Main agents
      mainExecutionBlock.trim() !== ''; // Runner invocations

  if (!hasExecutableElements) {
     // If only imports (and possibly pydantic models) were generated, add a note.
     finalCode += '# No executable workflow elements found to generate code.\n';
     finalCode += `# Nodes: ${nodes.length}, Edges: ${edges.length}\n`;
  }
  
  // Prepend workflow metadata comment (if any) to the entire assembled code
  if (workflowMetadataComment.trim() !== '') {
    finalCode = workflowMetadataComment + finalCode;
  }

  return utf8Header + finalCode;
}

function generateGuardrailPythonCode(
  guardrailNodeData: GuardrailNodeData,
  internalAgentPyName: string,
  guardrailFuncPyName: string,
  pydanticModelInfo: Map<string, { pyName: string, schema: PydanticModelSchema }>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _pythonIdentifiers: Set<string>, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _nodeId: string 
): string {
  let guardrailCode = '';
  const internalAgentData = {
    name: guardrailNodeData.internalAgentName,
    instructions: guardrailNodeData.internalAgentInstructions,
    pydanticSchema: guardrailNodeData.internalAgentPydanticSchema,
  };

  let internalAgentOutputTypePyName: string | null = null;
  if (internalAgentData.pydanticSchema && internalAgentData.pydanticSchema.modelName) {
    const modelInfo = pydanticModelInfo.get(internalAgentData.pydanticSchema.modelName);
    if (modelInfo) {
      internalAgentOutputTypePyName = modelInfo.pyName;
    } else {
      console.warn(`Pydantic model ${internalAgentData.pydanticSchema.modelName} for guardrail ${guardrailNodeData.name} internal agent not found in pre-computed map. This might lead to issues.`);
    }
  }
  
  guardrailCode += `# Internal Checker Agent for Guardrail: ${guardrailNodeData.name}\n`;
  guardrailCode += `${internalAgentPyName} = Agent(\n`;
  guardrailCode += `    name="${internalAgentPyName}",\n`;
  guardrailCode += `    instructions="""${internalAgentData.instructions || 'No instructions provided.'}""",\n`;
  if (internalAgentOutputTypePyName) {
    guardrailCode += `    output_type=${internalAgentOutputTypePyName},\n`;
  }
  guardrailCode += `    tools=[],\n`;
  guardrailCode += `    handoffs=[]\n`;
  guardrailCode += `)\n\n`;

  const decorator = guardrailNodeData.guardrailType === GuardrailType.INPUT ? '@input_guardrail' : '@output_guardrail';
  guardrailCode += `${decorator}\n`;
  const thirdArgName = guardrailNodeData.guardrailType === GuardrailType.INPUT ? 'input_data' : 'output_data';
  guardrailCode += `async def ${guardrailFuncPyName}(ctx: RunContextWrapper, agent: Agent, ${thirdArgName}: Any) -> GuardrailFunctionOutput:\n`;

  if (guardrailNodeData.description && guardrailNodeData.description.trim()) {
    const descriptionLines = guardrailNodeData.description.trim().split('\n');
    if (descriptionLines.length === 1) {
      guardrailCode += `    """${descriptionLines[0]}"""\n`;
    } else {
      guardrailCode += `    """\n${descriptionLines.map(line => `    ${line.trim()}`).join('\n')}\n    """\n`;
    }
  }
  
  guardrailCode += `    # Run the internal checker agent\n`;
  guardrailCode += `    internal_agent_input = f"Data to check: {str(${thirdArgName})}"\n`;
  guardrailCode += `    internal_agent_output = await ${internalAgentPyName}.run_async(input=internal_agent_input)\n\n`;
  
  guardrailCode += `    tripwire_triggered = False  # Default to not triggered\n`;
  guardrailCode += `    output_for_eval = None\n`;
  guardrailCode += `    if isinstance(internal_agent_output, AssistantMessage):\n`;
  guardrailCode += `        output_for_eval = internal_agent_output.content\n`;
  guardrailCode += `    elif internal_agent_output is not None:\n`;
  guardrailCode += `        output_for_eval = internal_agent_output\n\n`;

  guardrailCode += `    if output_for_eval is not None and isinstance(output_for_eval, BaseModel):\n`; // Ensure output_for_eval is a Pydantic model for safety with eval
  const userLogic = guardrailNodeData.tripwireConditionLogic ? guardrailNodeData.tripwireConditionLogic.trim() : "";
  if (userLogic && internalAgentOutputTypePyName) { 
    const escapedUserLogic = userLogic.replace(/\\/g, '\\\\\\\\').replace(/"""/g, '\\"\\"\\"');

    guardrailCode += `        user_logic_str = f"""${escapedUserLogic}"""\\n`;
    guardrailCode += `        if user_logic_str.strip():\\n`;
    guardrailCode += `            try:\\n`;
    guardrailCode += `                tripwire_triggered = bool(eval(user_logic_str, {"__builtins__": {}}, {"output": output_for_eval}))\\n`;
    guardrailCode += `            except Exception as e:\\n`;
    const escapedUserLogicForError = userLogic.replace(/'/g, "\\\\'").replace(/\\n/g, "\\\\n");
    guardrailCode += `                print(f"Error evaluating tripwire logic \'\'\'${escapedUserLogicForError}\'\'\' for guardrail \'${guardrailNodeData.name}\': {e}")\\n`;
    guardrailCode += `                tripwire_triggered = False\\n`;
    guardrailCode += `        else:\\n`;
    guardrailCode += `            print(f"Warning: Tripwire logic for guardrail \'${guardrailNodeData.name}\' is empty. Defaulting to not triggered.")\\n`;
    guardrailCode += `            tripwire_triggered = False\\n`;
  } else if (userLogic && !internalAgentOutputTypePyName) {
    guardrailCode += `        print(f"Warning: Tripwire logic \'${userLogic.replace(/'/g, "\\'")}\' for guardrail \'${guardrailNodeData.name}\' is set, but the internal agent has no Pydantic output type. Cannot reliably evaluate. Defaulting to not triggered.")\\n`;
    guardrailCode += `        tripwire_triggered = False\\n`;
  } else { 
    if (!userLogic) {
        guardrailCode += `        # No tripwire logic provided for guardrail \'${guardrailNodeData.name}\'. Defaulting to not triggered.\\n`;
    }
    guardrailCode += `        tripwire_triggered = False\\n`;
  }
  guardrailCode += `    elif output_for_eval is None:\\n`;
  guardrailCode += `        print(f"Warning: Internal agent output for guardrail \'${guardrailNodeData.name}\' was None. Cannot evaluate tripwire logic. Defaulting to not triggered.")\\n`;
  guardrailCode += `        tripwire_triggered = False\\n`;
  guardrailCode += `    else: \\n`;
  guardrailCode += `        print(f"Warning: Internal agent output for guardrail \'${guardrailNodeData.name}\' is not a Pydantic model (type: {type(output_for_eval).__name__}). Cannot reliably evaluate tripwire logic. Defaulting to not triggered.")\\n`;
  guardrailCode += `        tripwire_triggered = False\\n`;
  
  guardrailCode += `    final_output_info = output_for_eval if output_for_eval is not None else f"Guardrail ${guardrailNodeData.name} evaluated."\\n`;
  guardrailCode += `\\n    return GuardrailFunctionOutput(output_info=final_output_info, tripwire_triggered=tripwire_triggered)\\n\\n`;
  return guardrailCode;
}
