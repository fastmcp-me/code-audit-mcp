# MCP Server Audit Tool Error

**Date:** 2025-07-11  
**Priority:** HIGH  
**Status:** TODO  
**Component:** MCP Server - Tool Response Handling

## Issue Description

The MCP server's audit_code and health_check tools are failing with schema validation errors when attempting to return results. This prevents the server from being used for code auditing through the MCP protocol.

## Error Details

### Error 1: audit_code Tool Failure

```
MCP error -32603: Tool execution failed: Unknown error
```

### Error 2: health_check Tool Schema Validation

```json
{
  "code": "invalid_union",
  "unionErrors": [
    {
      "issues": [
        {
          "code": "invalid_literal",
          "expected": "text",
          "path": ["content", 0, "type"],
          "message": "Invalid literal value, expected \"text\""
        },
        {
          "code": "invalid_type",
          "expected": "string",
          "received": "undefined",
          "path": ["content", 0, "text"],
          "message": "Required"
        }
      ]
    }
  ]
}
```

## Root Cause Analysis

The error indicates that the MCP server is returning responses that don't match the expected MCP protocol schema. The server appears to be returning raw objects instead of properly formatted MCP content blocks.

### Expected MCP Response Format

```typescript
{
  content: [
    {
      type: 'text',
      text: 'Response content here',
    },
  ];
}
```

### Likely Current Response

```typescript
{
  content: [
    {
      // Missing type and text fields
      status: 'healthy',
      // ... other fields
    },
  ];
}
```

## Affected Code Locations

1. **src/server/index.ts** - Tool response handlers
   - `handleAuditCode()` method
   - `handleHealthCheck()` method
   - `handleListModels()` method
   - `handleUpdateConfig()` method

2. **Response formatting** - All tool handlers need to wrap responses in proper MCP content blocks

## Proposed Solution

### 1. Fix handleHealthCheck Method

```typescript
private async handleHealthCheck(): Promise<{ content: Array<{ type: string; text: string }> }> {
  const health = await this.checkHealth();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(health, null, 2)
      }
    ]
  };
}
```

### 2. Fix handleAuditCode Method

```typescript
// In handleAuditCode, ensure the result is wrapped properly
return {
  content: [
    {
      type: 'text',
      text: JSON.stringify(result, null, 2),
    },
  ],
};
```

### 3. Update All Tool Handlers

Ensure all tool handlers return responses in the correct MCP format with proper content blocks.

## Implementation Checklist

- [ ] Update handleHealthCheck to return proper MCP content blocks
- [ ] Update handleAuditCode to wrap audit results correctly
- [ ] Update handleListModels response format
- [ ] Update handleUpdateConfig response format
- [ ] Add response validation before returning
- [ ] Test all tools through MCP protocol
- [ ] Add unit tests for response formatting

## Testing Plan

1. **Unit Tests**: Add tests for each handler's response format
2. **Integration Tests**: Test through actual MCP client connection
3. **Manual Testing**:

   ```bash
   # Start server
   code-audit start --stdio

   # Test with MCP client
   # Verify all tools return valid responses
   ```

## Impact

- **High**: Server is currently unusable through MCP protocol
- **Affects**: All MCP tool functionality
- **Users**: Anyone trying to use code-audit-mcp through Claude or other MCP clients

## Success Criteria

- [ ] All MCP tools return valid responses
- [ ] No schema validation errors
- [ ] Server can be used successfully from Claude Code
- [ ] All tool responses follow MCP protocol specification

## References

- MCP Protocol Specification: https://modelcontextprotocol.io/
- Current implementation: src/server/index.ts
- Error location: Tool response handling
