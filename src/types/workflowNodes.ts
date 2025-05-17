import { Node } from 'reactflow'; // Import Node

// 基本節點數據，所有自訂節點都應包含 name
export interface NodeBaseData { // Renamed from BaseNodeData to NodeBaseData for clarity and to avoid conflict if any
  name: string;
  isExpanded?: boolean; // Added for node expansion/collapse
  // nodeType: 'agent' | 'runner' | 'functionTool' | 'input' | 'guardrail'; // Added guardrail
}

// Agent 節點特有的數據
export interface AgentNodeData extends NodeBaseData {
  nodeType: 'agent'; // Ensure this discriminant property is present
  instructions: string;
  handoff_description?: string;
  // output_type field is removed as pydanticSchema presence implies pydantic output
  pydanticSchema?: PydanticModelSchema;
}

// Runner 節點特有的數據
export interface RunnerNodeData extends NodeBaseData {
  nodeType: 'runner'; // Discriminant
  input: string;
  execution_mode: 'sync' | 'async';
  context?: string;
}

// Function Tool 節點參數
export interface FunctionToolParameter {
  id: string;
  name: string;
  type: string; // Kept as string to allow flexibility e.g. 'str', 'int', 'List[str]'
}

// Function Tool 節點特有的數據
export interface FunctionToolNodeData extends NodeBaseData {
  nodeType: 'functionTool'; // Discriminant
  description?: string;
  parameters: FunctionToolParameter[];
  returnType: string; // Kept as string
  implementation: string;
}

// 用戶輸入節點特有的數據
export interface InputNodeData extends NodeBaseData {
  nodeType: 'input'; // Discriminant
  message: string;
}

// Pydantic Field 定義
export interface PydanticField {
  id: string;
  name: string;
  type: string; // e.g., 'str', 'int', 'bool', 'List[str]', 'CustomModel'
  isOptional: boolean;
  description?: string;
}

// Pydantic 模型結構定義
export interface PydanticModelSchema {
  modelName: string;
  fields: PydanticField[];
  description?: string;
}

// New Guardrail Type Definitions
export enum GuardrailType {
  INPUT = 'input',
  OUTPUT = 'output',
}

export interface GuardrailNodeData extends NodeBaseData {
  nodeType: 'guardrail'; // Discriminant
  guardrailType: GuardrailType;
  description?: string;
  internalAgentName: string;
  internalAgentInstructions: string;
  internalAgentPydanticSchema?: PydanticModelSchema;
  tripwireConditionLogic: string; // Example: "output.is_homework === true"
  pythonFunctionName?: string; // Auto-generated: e.g., "homework_check_guardrail"
}

// Union type for all possible node data structures
export type CustomNodeData =
  | AgentNodeData
  | RunnerNodeData
  | FunctionToolNodeData
  | InputNodeData
  | GuardrailNodeData; // Added GuardrailNodeData

// Defines the generic WorkflowNode type using React Flow's Node and our CustomNodeData
export type WorkflowNode = Node<CustomNodeData>;


// The following were removed or refactored:
// - Removed duplicate AgentNodeData definition.
// - Removed original BaseNodeData and used NodeBaseData throughout.
// - Ensured all specific node data interfaces (AgentNodeData, RunnerNodeData, etc.) extend NodeBaseData
//   and include a unique `nodeType` literal type for type guarding.
// - Simplified `FunctionToolParameter` and `FunctionToolNodeData` `type` and `returnType` to `string` for flexibility,
//   assuming validation or mapping will occur elsewhere (e.g., in PropertiesPanel or codegen).
// - The original `NodeData` alias (which was almost identical to the duplicate AgentNodeData) was removed.
// - `CustomNodeData` is now the main union type for the `data` property of a `WorkflowNode`.
// - `WorkflowNode` is now correctly typed as `Node<CustomNodeData>`. 