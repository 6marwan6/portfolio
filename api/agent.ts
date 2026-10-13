import { defaultDeps } from "./_lib/deps";
import { handleAgent } from "./_lib/handlers";

export async function POST(request: Request): Promise<Response> {
  return handleAgent(request, defaultDeps());
}

export async function GET(request: Request): Promise<Response> {
  return handleAgent(request, defaultDeps()); // answers 405
}
