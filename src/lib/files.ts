import { FileSystemTree } from '@webcontainer/api';

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
        }
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