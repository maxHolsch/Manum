describe('Extension package smoke test', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should import shared types via require', () => {
    // ts-jest supports require for CJS interop
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const shared = require('@manum/shared') as typeof import('@manum/shared');
    expect(shared).toBeDefined();
  });
});
