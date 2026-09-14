import 'dotenv/config';
import { validateEnv } from '../config/env';
import { ASSISTANT_NAME, buildAssistant } from '../modules/voice/assistant/assistant.definition';
import { VapiClient } from '../modules/voice/vapi.client';

const PHONE_NUMBER_NAME = 'CareCloud Intake Line';
const LLM_MODEL = 'gpt-4.1-mini';
const DESIRED_AREA_CODE = '815';

/**
 * Pushes the assistant defined in code to Vapi and makes sure a free phone
 * number points at it. Safe to re-run: everything is matched by name.
 *
 *   npm run vapi:sync
 */
async function main() {
  const env = validateEnv(process.env);
  const vapi = new VapiClient(env.VAPI_API_KEY);

  const credentials = await vapi.listCredentials();
  if (!credentials.some((c) => c.provider === 'openai')) {
    await vapi.createCredential({
      provider: 'openai',
      apiKey: env.OPENAI_API_KEY,
      name: 'carecloud-openai',
    });
    console.log('Registered OpenAI key with Vapi');
  }

  const definition = buildAssistant({
    webhookUrl: `${env.PUBLIC_BASE_URL}/voice/webhook`,
    webhookSecret: env.VAPI_WEBHOOK_SECRET,
    model: LLM_MODEL,
  });
  const existing = (await vapi.listAssistants()).find((a) => a.name === ASSISTANT_NAME);
  const assistant = existing
    ? await vapi.updateAssistant(existing.id, definition)
    : await vapi.createAssistant(definition);
  console.log(`${existing ? 'Updated' : 'Created'} assistant ${assistant.id}`);

  const numbers = await vapi.listPhoneNumbers();
  let number = numbers.find((n) => n.name === PHONE_NUMBER_NAME) ?? numbers[0];
  if (!number) {
    number = await vapi.createPhoneNumber({
      provider: 'vapi',
      name: PHONE_NUMBER_NAME,
      numberDesiredAreaCode: DESIRED_AREA_CODE,
      assistantId: assistant.id,
    });
    console.log(`Provisioned phone number ${number.number}`);
  } else if (number.assistantId !== assistant.id) {
    number = await vapi.updatePhoneNumber(number.id, { assistantId: assistant.id });
    console.log(`Pointed phone number ${number.number} at the assistant`);
  }

  console.log(
    `\nAssistant: ${assistant.id}\nPhone:     ${number.number}\nWebhook:   ${env.PUBLIC_BASE_URL}/voice/webhook`,
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
