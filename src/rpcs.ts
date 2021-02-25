import { Operation } from '@apollo/client';
import { print, ExecutionResult, GraphQLError } from 'graphql';
import { Message } from './types';

export type RPCNotificationMessage<TParam> = {
  jsonrpc: '2.0';
  method: string;
  params: TParam;
};
export const isRPCNotificationMessage = <T>(message: Message): message is RPCNotificationMessage<T> =>
  (message as Record<string, unknown>).jsonrpc === '2.0';



export const parseRPCNotificationMessage = <T>(message: Message): RPCNotificationMessage<T> | null => {
  if (!isRPCNotificationMessage(message)) return null;
  if (typeof message.params !== 'string') return null;
  try {
    const parsed = JSON.parse(message.params);
    return {
      ...message,
      params: parsed,
    }
  } catch(e) {
    return null;
  }
};

const isRecord = (r: unknown): r is Record<string, unknown> => typeof r === 'object' && r !== null;

// requester -> executor
export type OperationRequestRPC = RPCNotificationMessage<{
  operationId: string;
  operationName: string;
  variables: Record<string, unknown>;
  query: string;
  context: Record<string, unknown>;
}>;
export const OPERATION_REQUEST_METHOD = 'operation-request';
export const operationRequestRPC = (operationId: string, operation: Operation): RPCNotificationMessage<string> => {
  const { clientAwareness } = operation.getContext()
  const context = {
    clientAwareness
  }

  return ({
    jsonrpc: '2.0',
    method: OPERATION_REQUEST_METHOD,
    params: JSON.stringify({
      operationId,
      operationName: operation.operationName,
      variables: operation.variables,
      query: print(operation.query),
      context,
    })
  })
};
export const isOperationRequestRPC = (message: Message): message is OperationRequestRPC =>
  isRPCNotificationMessage(message) && (message.method === OPERATION_REQUEST_METHOD);

// executor -> requester
export interface SerializedExecutionResult {
  data?: Record<string, unknown> | null;
  errors?: readonly GraphQLError[];
}
export type OperationResultRPC = RPCNotificationMessage<{
  operationId: string;
  result: SerializedExecutionResult;
}>;
export const OPERATION_RESULT_METHOD = 'operation-result';
export const operationResultRPC = (operationId: string, result: ExecutionResult): RPCNotificationMessage<string> => ({
  jsonrpc: '2.0',
  method: OPERATION_RESULT_METHOD,
  params: JSON.stringify({
    operationId,
    result,
  })
});
export const isOperationResultRPC = (message: Message, operationId: string): message is OperationResultRPC =>
  isRPCNotificationMessage(message) &&
  (message.method === OPERATION_RESULT_METHOD) &&
  (isRecord(message.params) && message.params.operationId === operationId);

// executor -> requester
export type OperationErrorRPC = RPCNotificationMessage<{
  operationId: string;
  errorMessage: string;
}>
export const OPERATION_ERROR_METHOD = 'operation-error';
export const operationErrorRPC = (operationId: string, errorValue: unknown): RPCNotificationMessage<string> => {
  let errorMessage = '<unknow error>';
  if (errorValue instanceof Error) {
    errorMessage = errorValue.message;
  }
  return {
    jsonrpc: '2.0',
    method: OPERATION_ERROR_METHOD,
    params: JSON.stringify({
      operationId,
      errorMessage,
    })
  };
};
export const isOperationErrorRPC = (message: Message, operationId: string): message is OperationErrorRPC =>
  isRPCNotificationMessage(message) &&
  (message.method === OPERATION_ERROR_METHOD) &&
  (isRecord(message.params) && message.params.operationId === operationId);


// executor -> requester
export type OperationCompleteRPC = RPCNotificationMessage<{ operationId: string }>;
export const OPERATION_COMPLETE_METHOD = 'operation-complete';
export const operationCompleteRPC = (operationId: string): RPCNotificationMessage<string> => ({
  jsonrpc: '2.0',
  method: OPERATION_COMPLETE_METHOD,
  params: JSON.stringify({
    operationId,
  })
});
export const isOperationCompleteRPC = (message: Message, operationId: string): message is OperationCompleteRPC =>
  isRPCNotificationMessage(message) &&
  (message.method === OPERATION_COMPLETE_METHOD) &&
  (isRecord(message.params) && message.params.operationId === operationId);

// requester -> executor
export type OperationUnsubscribeRPC = RPCNotificationMessage<{
  operationId: string;
}>;
export const OPERATION_UNSUBSCRIBE_METHOD = 'operation-unsubscribe';
export const operationUnsubscribeRPC = (operationId: string): RPCNotificationMessage<string> => ({
  jsonrpc: '2.0',
  method: OPERATION_UNSUBSCRIBE_METHOD,
  params: JSON.stringify({
    operationId,
  })
});
export const isOperationUnsubscribeRPC = (message: Message, operationId: string): message is OperationUnsubscribeRPC =>
  isRPCNotificationMessage(message) &&
  (message.method === OPERATION_UNSUBSCRIBE_METHOD) &&
  (isRecord(message.params) && message.params.operationId === operationId);
