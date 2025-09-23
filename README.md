# Spotify MCP Server

An unofficial Spotify MCP server that provides access to Spotify's Web API through the Model Context Protocol.

## Overview

This MCP server allows AI assistants to interact with Spotify's Web API, enabling functionality like searching for music, managing playlists, controlling playback, and more. The server is hosted at https://spotify-mcp-server-3664f81c.alpic.live/ for easy integration.

## Prerequisites

- Node.js 22+ (see `.nvmrc` for exact version)
- Spotify Developer Account and App (for local development)

## Installation

### For MCP Client Integration

For easy installation in Claude Desktop or other MCP clients, follow the installation guide:
https://mcp-install-instructions.alpic.cloud/servers/spotify-unofficial

### For Local Development

1. Clone the repository:

```bash
git clone <repository-url>
cd spotify-mcp-server
```

2. Install dependencies:

```bash
npm install
```

3. Set up Spotify App:
   - Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Note your Client ID and Client Secret
   - Add `http://localhost:3000/callback` to your app's redirect URIs

4. Create environment file:

```bash
cp .env.example .env
```

5. Update `.env` with your Spotify credentials:
   - `SPOTIFY_CLIENT_ID=your_client_id_here`

## Usage

### Development

Start the development server with hot-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000` and automatically restart when you make changes to the source code.

### Production Build

Build the project for production:

```bash
npm run build
```

The compiled JavaScript will be output to the `dist/` directory.

### Running the Inspector

Use the MCP inspector tool to test your server:

```bash
npm run inspector
```

## API Endpoints

- `POST /mcp` - Main MCP communication endpoint
- `GET /mcp` - Returns "Method not allowed" (405)
- `DELETE /mcp` - Returns "Method not allowed" (405)

## Development

### Adding New Tools

To add a new tool, modify `src/server.ts`:

```typescript
server.tool(
  "tool-name",
  "Tool description",
  {
    // Define your parameters using Zod schemas
    param: z.string().describe("Parameter description"),
  },
  async ({ param }): Promise<CallToolResult> => {
    // Your tool implementation
    return {
      content: [
        {
          type: "text",
          text: `Result: ${param}`,
        },
      ],
    };
  },
);
```

### Adding New Prompts

To add a new prompt template, modify `src/server.ts`:

```typescript
server.prompt(
  "prompt-name",
  "Prompt description",
  {
    // Define your parameters using Zod schemas
    param: z.string().describe("Parameter description"),
  },
  async ({ param }): Promise<GetPromptResult> => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Your prompt content with ${param}`,
          },
        },
      ],
    };
  },
);
```

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Express.js Documentation](https://expressjs.com/)
