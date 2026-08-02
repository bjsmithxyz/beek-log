export function uploaderCapabilities(scope = globalThis) {
  const checks = {
    desktopPointer: scope.matchMedia?.('(min-width: 800px) and (pointer: fine)')?.matches === true,
    secureContext: scope.isSecureContext === true,
    directoryPicker: typeof scope.showDirectoryPicker === 'function',
    workers: typeof scope.Worker === 'function',
    webAssembly: typeof scope.WebAssembly === 'object',
    imageBitmap: typeof scope.createImageBitmap === 'function',
    offscreenCanvas: typeof scope.OffscreenCanvas === 'function',
    randomUUID: typeof scope.crypto?.randomUUID === 'function',
  };
  return {
    supported: Object.values(checks).every(Boolean),
    checks,
    missing: Object.entries(checks).filter(([, present]) => !present).map(([name]) => name),
  };
}
