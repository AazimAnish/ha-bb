import { FileSystemTree, WebContainer } from '@webcontainer/api';

export const initialFiles: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify({
        name: "nextjs-app",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint"
        },
        dependencies: {
          "next": "^14.0.0",
          "react": "^18.0.0",
          "react-dom": "^18.0.0"
        },
        devDependencies: {
          "next": "^14.0.0",
          "react": "^18.0.0",
          "react-dom": "^18.0.0"
        },
        "type": "module" 
      }, null, 2)
    }
  },
  '.gitignore': {
    file: {
      contents: `
node_modules
.next
.env
`
    }
  }
};

export async function writeFile(webcontainer: WebContainer, path: string, contents: string) {
  await webcontainer.fs.writeFile(path, contents);
}

export async function createDirectory(webcontainer: WebContainer, path: string) {
  await webcontainer.fs.mkdir(path, { recursive: true });
} 