import fs from "fs";
import path from "path";

export class PromptService {
  private baseDir = path.resolve(__dirname, "../prompts");

  getPrompt(name: string): string {
    const filePath = path.join(this.baseDir, `${name}.txt`);
    return fs.readFileSync(filePath, "utf8");
  }
}
