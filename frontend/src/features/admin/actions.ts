'use server';
import { revalidatePath } from 'next/cache';
import { ApiError } from '../patients/api';
import { createSlot, deleteSlot } from './api';

export interface SlotActionState {
  error: string | null;
}

export async function addSlotAction(formData: FormData): Promise<SlotActionState> {
  const local = String(formData.get('starts_at') ?? '');
  if (!local) return { error: 'Choose a date and time.' };

  // The datetime-local field carries no zone; interpret it against server time.
  const parsed = new Date(local);
  if (Number.isNaN(parsed.getTime())) return { error: 'That date and time is not valid.' };

  try {
    await createSlot(parsed.toISOString());
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'The slot could not be created.' };
  }

  revalidatePath('/appointments');
  return { error: null };
}

export async function removeSlotAction(id: string): Promise<SlotActionState> {
  try {
    await deleteSlot(id);
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'The slot could not be removed.' };
  }

  revalidatePath('/appointments');
  return { error: null };
}
