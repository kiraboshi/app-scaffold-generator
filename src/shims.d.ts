declare module 'fs' { const x: any; export = x }
declare module 'path' { const x: any; export = x }
declare module 'url' { const x: any; export = x }
declare module 'child_process' { const x: any; export = x }
declare module 'minimatch' { export class Minimatch { constructor(pattern: string, opts?: any); match(str: string): boolean } }
declare var process: any


