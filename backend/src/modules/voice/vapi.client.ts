const VAPI_API = 'https://api.vapi.ai';

export interface VapiAssistant {
  id: string;
  name: string;
}

export interface VapiCredential {
  id: string;
  provider: string;
}

export interface VapiPhoneNumber {
  id: string;
  number?: string;
  name?: string;
  assistantId?: string;
}

/** Thin wrapper over the Vapi management API, used only by the sync script. */
export class VapiClient {
  constructor(private readonly apiKey: string) {}

  listAssistants() {
    return this.request<VapiAssistant[]>('GET', '/assistant');
  }

  createAssistant(body: unknown) {
    return this.request<VapiAssistant>('POST', '/assistant', body);
  }

  updateAssistant(id: string, body: unknown) {
    return this.request<VapiAssistant>('PATCH', `/assistant/${id}`, body);
  }

  listCredentials() {
    return this.request<VapiCredential[]>('GET', '/credential');
  }

  createCredential(body: unknown) {
    return this.request<VapiCredential>('POST', '/credential', body);
  }

  listPhoneNumbers() {
    return this.request<VapiPhoneNumber[]>('GET', '/phone-number');
  }

  createPhoneNumber(body: unknown) {
    return this.request<VapiPhoneNumber>('POST', '/phone-number', body);
  }

  updatePhoneNumber(id: string, body: unknown) {
    return this.request<VapiPhoneNumber>('PATCH', `/phone-number/${id}`, body);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${VAPI_API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Vapi ${method} ${path} -> ${res.status}: ${text}`);
    return (text ? JSON.parse(text) : undefined) as T;
  }
}
