// Test file with fixed linting issues
// Removed unused imports and variables
// Fixed formatting and other issues

// Well formatted function with proper spacing and types
function wellFormattedFunction(param1: string, param2: number): string {
  // Proper semicolon and spacing
  const result = param1 + param2.toString();
  return result;
}

// Function with early return but no unreachable code
function fixedFunction(): string {
  return 'early return';
  // Removed unreachable console.log
}

// Fixed function with proper types instead of any
function properlyTypedFunction(data: string): string {
  return data;
}

// Removed console.log statement

// Function with proper return type annotation
function properReturnType(x: number): number {
  return x * 2;
}

// Broken up long line for better readability
const readableLine =
  'This line has been broken up into multiple lines ' +
  'for better readability and maintainability in the codebase';

export {
  wellFormattedFunction,
  fixedFunction,
  properlyTypedFunction,
  properReturnType,
  readableLine,
};
