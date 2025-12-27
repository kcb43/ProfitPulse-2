/**
 * Database utilities for Render Worker
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function claimJob() {
  const { data: queued, error: qErr } = await supabase
    .from('listing_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (qErr) {
    console.error('Error fetching queued job:', qErr);
    throw qErr;
  }
  if (!queued) return null;

  const { data: claimed, error: cErr } = await supabase
    .from('listing_jobs')
    .update({
      status: 'running',
      progress: { percent: 0, message: 'Claimed by worker' },
      updated_at: new Date().toISOString(),
    })
    .eq('id', queued.id)
    .eq('status', 'queued')
    .select('*')
    .single();

  if (cErr) {
    console.error('Error claiming job:', cErr);
    throw cErr;
  }

  return claimed;
}

export async function updateJobProgress(jobId, progress) {
  const { error } = await supabase
    .from('listing_jobs')
    .update({ progress, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job progress:', error);
    throw error;
  }
}

export async function updateJobResult(jobId, result) {
  // Only update the result payload here. Status is managed by the worker logic.
  // (Some schemas may not have completed_at, and we shouldn't overwrite a failed status.)
  const { error } = await supabase
    .from('listing_jobs')
    .update({ result, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job result:', error);
    throw error;
  }
}

export async function markJobFailed(jobId, errorMessage) {
  // Schema-tolerant: error column may be jsonb
  const { error } = await supabase
    .from('listing_jobs')
    .update({
      status: 'failed',
      error: { message: errorMessage },
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error('Error marking job as failed:', error);
    throw error;
  }
}

export async function logJobEvent(jobId, level, message, metadata = {}) {
  // Schema-tolerant: listing_job_events differs across environments.
  // Some have NOT NULL `level`, some have `event_type`, some have neither.
  const attempts = [
    { job_id: jobId, level, event_type: level, message, metadata, created_at: new Date().toISOString() },
    { job_id: jobId, level, message, metadata, created_at: new Date().toISOString() },
    { job_id: jobId, event_type: level, message, metadata, created_at: new Date().toISOString() },
    { job_id: jobId, level, event_type: level, message, metadata },
    { job_id: jobId, level, message, metadata },
    { job_id: jobId, event_type: level, message, metadata },
    { job_id: jobId, message, metadata },
    { job_id: jobId, message },
  ];

  for (const row of attempts) {
    const { error } = await supabase.from('listing_job_events').insert(row);
    if (!error) return;

    const msg = typeof error.message === 'string' ? error.message : '';
    const code = error.code;

    const retriable =
      code === 'PGRST204' || // column missing in schema cache
      code === '23502' || // not-null constraint (e.g., missing level)
      msg.includes('Could not find the') ||
      msg.includes('null value in column');

    if (!retriable) {
      console.error('Error logging job event:', error);
      return;
    }
  }
}
