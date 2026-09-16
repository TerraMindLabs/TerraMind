const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { exec } = require("child_process");
const util = require("util");

const execPromise = util.promisify(exec);


const server = new Server(
  { name: "tf-runner", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "terraform_validate",
        description: "Runs 'terraform init' and 'terraform validate' on the workspace to ensure the code is syntactically correct.",
        inputSchema: { 
          type: "object", 
          properties: {
            project_path: { type: "string", description: "The absolute path to the directory containing the .tf files (e.g., E:\\TerraformProject\\project-name)" }
          },
          required: ["project_path"]
        },
      },
      {
        name: "terraform_fmt",
        description: "Runs 'terraform fmt' to format the Terraform code according to standard conventions.",
        inputSchema: { 
          type: "object", 
          properties: {
            project_path: { type: "string", description: "The absolute path to the directory containing the .tf files" }
          },
          required: ["project_path"]
        },
      },
      {
        name: "terraform_scan",
        description: "Runs 'tfsec' (or Trivy) on the workspace to find security vulnerabilities.",
        inputSchema: { 
          type: "object", 
          properties: {
            project_path: { type: "string", description: "The absolute path to the directory containing the .tf files" }
          },
          required: ["project_path"]
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments;
  if (!args || !args.project_path) {
    return { isError: true, content: [{ type: "text", text: "Error: project_path argument is required" }] };
  }
  const targetDir = args.project_path;

  if (request.params.name === "terraform_validate") {
    try {
      const envArgs = { ...process.env, TF_PLUGIN_CACHE_DIR: "C:\\TerraformProject\\.terraform.d\\plugin-cache" };
      const { stdout: initOut } = await execPromise("terraform init -backend=false", { cwd: targetDir, env: envArgs });
      const { stdout: valOut, stderr: valErr } = await execPromise("terraform validate", { cwd: targetDir });
      return { content: [{ type: "text", text: `Init:\n${initOut}\nValidate:\n${valOut}\n${valErr}` }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Error: ${error.message}\n${error.stdout}\n${error.stderr}` }] };
    }
  }

  if (request.params.name === "terraform_fmt") {
    try {
      const { stdout, stderr } = await execPromise("terraform fmt", { cwd: targetDir });
      return { content: [{ type: "text", text: `Format Output:\n${stdout}\n${stderr}` }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Error: ${error.message}\n${error.stdout}\n${error.stderr}` }] };
    }
  }

  if (request.params.name === "terraform_scan") {
    try {
      const { stdout, stderr } = await execPromise("E:\\LibreChat\\tfsec.exe .", { cwd: targetDir });
      return { content: [{ type: "text", text: `Scan Output:\n${stdout}\n${stderr}` }] };
    } catch (error) {
      // tfsec returns non-zero exit code if vulnerabilities are found
      return { content: [{ type: "text", text: `Scan Findings:\n${error.stdout}\n${error.stderr}` }] };
    }
  }

  throw new Error("Tool not found");
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TF Runner MCP Server started on stdio");
}

run().catch(console.error);
