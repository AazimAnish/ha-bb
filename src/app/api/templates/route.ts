export function getTemplatePrompt(stack: string) {
    return `Here is an artifact that contains all files of the project visible to you.
Consider the contents of ALL files in the project.

${getBasePrompt(stack)}

Here is a list of files that exist on the file system but are not being shown to you:

  - .gitignore
  - package-lock.json`;
}

export function getBasePrompt(stack: string) {
    if (stack.toLowerCase() === 'react') {
        return `<boltArtifact id="project-import" title="Next.js Project Files">
        <boltAction type="file" filePath="package.json">
        {
          "name": "next-app",
          "version": "0.1.0",
          "private": true,
          "scripts": {
            "dev": "next dev",
            "build": "next build",
            "start": "next start",
            "lint": "next lint"
          },
          "dependencies": {
            "react": "^18",
            "react-dom": "^18",
            "next": "14.1.0"
          },
          "devDependencies": {
            "typescript": "^5",
            "@types/node": "^20",
            "@types/react": "^18",
            "@types/react-dom": "^18",
            "autoprefixer": "^10.0.1",
            "postcss": "^8",
            "tailwindcss": "^3.3.0",
            "eslint": "^8",
            "eslint-config-next": "14.1.0"
          }
        }
        </boltAction>
        // Add more Next.js specific files...
        </boltArtifact>`;
    }

    return `<boltArtifact id="project-import" title="Node.js Project Files">
    <boltAction type="file" filePath="package.json">
    {
      "name": "node-starter",
      "private": true,
      "scripts": {
        "dev": "tsx watch src/index.ts",
        "build": "tsc",
        "start": "node dist/index.js"
      },
      "dependencies": {},
      "devDependencies": {
        "typescript": "^5",
        "@types/node": "^20",
        "tsx": "^4.7.0"
      }
    }
    </boltAction>
    // Add more Node.js specific files...
    </boltArtifact>`;
}