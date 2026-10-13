import { defaultDeps } from "./_lib/deps";
import { handleRecruiter } from "./_lib/handlers";

export async function POST(request: Request): Promise<Response> {
  return handleRecruiter(request, defaultDeps());
}

export async function GET(request: Request): Promise<Response> {
  return handleRecruiter(request, defaultDeps()); // answers 405
}
