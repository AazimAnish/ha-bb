export const TEMPLATE_FILES = {
    nextjs: `<boltArtifact id="project-import" title="Next.js Project Files">
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
            "next": "14.1.0",
            "react": "^18",
            "react-dom": "^18"
          },
          "devDependencies": {
            "@types/node": "^20",
            "@types/react": "^18",
            "@types/react-dom": "^18",
            "typescript": "^5",
            "autoprefixer": "^10.0.1",
            "postcss": "^8",
            "tailwindcss": "^3.3.0",
            "eslint": "^8",
            "eslint-config-next": "14.1.0"
          }
        }
        </boltAction>
        <boltAction type="file" filePath="tsconfig.json">
        {
          "compilerOptions": {
            "lib": ["dom", "dom.iterable", "esnext"],
            "allowJs": true,
            "skipLibCheck": true,
            "strict": true,
            "noEmit": true,
            "esModuleInterop": true,
            "module": "esnext",
            "moduleResolution": "bundler",
            "resolveJsonModule": true,
            "isolatedModules": true,
            "jsx": "preserve",
            "incremental": true,
            "plugins": [
              {
                "name": "next"
              }
            ],
            "paths": {
              "@/*": ["./src/*"]
            }
          },
          "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          "exclude": ["node_modules"]
        }
        </boltAction>
        <boltAction type="file" filePath="next.config.mjs">
        /** @type {import('next').NextConfig} */
        const nextConfig = {
          reactStrictMode: true,
        };
        
        export default nextConfig;
        </boltAction>
        <boltAction type="file" filePath="postcss.config.js">
        module.exports = {
          plugins: {
            tailwindcss: {},
            autoprefixer: {},
          },
        };
        </boltAction>
        <boltAction type="file" filePath="tailwind.config.ts">
        import type { Config } from "tailwindcss";
        
        const config: Config = {
          content: [
            "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
            "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
            "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
          ],
          theme: {
            extend: {},
          },
          plugins: [],
        };
        export default config;
        </boltAction>
        <boltAction type="file" filePath="src/app/layout.tsx">
        import type { Metadata } from "next";
        import { Inter } from "next/font/google";
        import "./globals.css";
        
        const inter = Inter({ subsets: ["latin"] });
        
        export const metadata: Metadata = {
          title: "Next.js App",
          description: "Generated Next.js Application",
        };
        
        export default function RootLayout({
          children,
        }: Readonly<{
          children: React.ReactNode;
        }>) {
          return (
            <html lang="en">
              <body className={inter.className}>{children}</body>
            </html>
          );
        }
        </boltAction>
        <boltAction type="file" filePath="src/app/globals.css">
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
        </boltAction>
        <boltAction type="file" filePath="src/app/page.tsx">
        export default function Home() {
          return (
            <main className="flex min-h-screen flex-col items-center justify-center p-24">
              <p>Start prompting to see magic happen :)</p>
            </main>
          );
        }
        </boltAction>
        </boltArtifact>`,

    react: `<boltArtifact id="project-import" title="React Project Files">
        <boltAction type="file" filePath="package.json">
        {
          "name": "vite-react",
          "private": true,
          "version": "0.0.0",
          "type": "module",
          "scripts": {
            "dev": "vite",
            "build": "tsc && vite build",
            "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
            "preview": "vite preview"
          },
          "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
          },
          "devDependencies": {
            "@types/react": "^18.2.43",
            "@types/react-dom": "^18.2.17",
            "@typescript-eslint/eslint-plugin": "^6.14.0",
            "@typescript-eslint/parser": "^6.14.0",
            "@vitejs/plugin-react": "^4.2.1",
            "autoprefixer": "^10.4.16",
            "eslint": "^8.55.0",
            "eslint-plugin-react-hooks": "^4.6.0",
            "eslint-plugin-react-refresh": "^0.4.5",
            "postcss": "^8.4.32",
            "tailwindcss": "^3.4.0",
            "typescript": "^5.2.2",
            "vite": "^5.0.8"
          }
        }
        </boltAction>
        </boltArtifact>`,

    node: `<boltArtifact id="project-import" title="Node.js Project Files">
        <boltAction type="file" filePath="package.json">
        {
          "name": "node-starter",
          "version": "1.0.0",
          "private": true,
          "scripts": {
            "dev": "tsx watch src/index.ts",
            "build": "tsc",
            "start": "node dist/index.js"
          },
          "dependencies": {
            "express": "^4.18.2"
          },
          "devDependencies": {
            "@types/express": "^4.17.21",
            "@types/node": "^20.11.5",
            "tsx": "^4.7.0",
            "typescript": "^5.3.3"
          }
        }
        </boltAction>
        </boltArtifact>`
};

export const BASE_PROMPT = `You are a code generator AI. You will receive user prompts and must generate code based on them.
Always respond with XML tags in this format:

<boltArtifact id="..." title="...">
  <boltAction type="file" filePath="path/to/file">
    // File contents here...
  </boltAction>
</boltArtifact>

You can include multiple boltAction tags within a single boltArtifact.
Each file's content must be complete and functional.`;

export function getSystemPrompt() {
    return `You are a code generator AI assistant. Your responses should always be XML tags that create or modify files.

Always use this format:
<boltArtifact id="unique-id" title="Description">
  <boltAction type="file" filePath="path/to/file">
    // File contents
  </boltAction>
</boltArtifact>

Guidelines:
- Generate complete, functional code
- Use TypeScript when possible
- Follow best practices and conventions
- Include proper error handling
- Add comments for complex logic
- Keep code modular and maintainable`;
}