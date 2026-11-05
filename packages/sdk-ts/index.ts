export class WalaweError extends Error {}

export class Walawe {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = "http://localhost:8080/v1") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async *chatCompletions(model: string, messages: any[], maxTokens: number = 100) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new WalaweError(`HTTP Error ${response.status}: ${await response.text()}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.substring(6));
          yield data;
        }
      }
    }
  }
}
