/**
 * Upload Pexels Images to Supabase Storage
 * Uploads all downloaded Pexels destination images to permanent storage
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env.local
config({ path: path.join(__dirname, '../../.env.local') });

const CONFIG = {
  IMAGES_DIR: path.join(__dirname, 'pexels-images'),
  BUCKET_NAME: 'destination-images',
  BATCH_SIZE: 10,
  DELAY_MS: 100, // Small delay between uploads
  PROGRESS_FILE: path.join(__dirname, 'supabase-upload-progress.json'),
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Progress {
  completedDestinations: string[];
  uploadedImages: number;
  failedImages: { destination: string; file: string; error: string }[];
  lastUpdated: string;
}

const INITIAL_PROGRESS: Progress = {
  completedDestinations: [],
  uploadedImages: 0,
  failedImages: [],
  lastUpdated: new Date().toISOString(),
};

function loadProgress(): Progress {
  try {
    if (fs.existsSync(CONFIG.PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG.PROGRESS_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('Starting fresh progress tracking');
  }
  return { ...INITIAL_PROGRESS };
}

function saveProgress(progress: Progress): void {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CONFIG.PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function ensureBucketExists(): Promise<boolean> {
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('Error listing buckets:', error);
    return false;
  }

  const bucketExists = buckets?.some(b => b.name === CONFIG.BUCKET_NAME);

  if (!bucketExists) {
    console.log(`Creating bucket: ${CONFIG.BUCKET_NAME}`);
    const { error: createError } = await supabase.storage.createBucket(CONFIG.BUCKET_NAME, {
      public: true,
    });

    if (createError) {
      console.error('Error creating bucket:', createError);
      return false;
    }
    console.log('Bucket created successfully');
  }

  return true;
}

async function uploadImage(
  destination: string,
  fileName: string,
  imageBuffer: Buffer
): Promise<string | null> {
  const filePath = `${destination}/${fileName}`;

  const { error } = await supabase.storage
    .from(CONFIG.BUCKET_NAME)
    .upload(filePath, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error(`Upload error for ${filePath}:`, error.message);
    return null;
  }

  const { data } = supabase.storage
    .from(CONFIG.BUCKET_NAME)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function processDestination(
  destination: string,
  progress: Progress
): Promise<number> {
  const destDir = path.join(CONFIG.IMAGES_DIR, destination);

  if (!fs.existsSync(destDir)) {
    return 0;
  }

  const files = fs.readdirSync(destDir).filter(f => f.endsWith('.jpg'));
  let uploaded = 0;

  for (const file of files) {
    const filePath = path.join(destDir, file);
    const imageBuffer = fs.readFileSync(filePath);

    const url = await uploadImage(destination, file, imageBuffer);

    if (url) {
      uploaded++;
      progress.uploadedImages++;
    } else {
      progress.failedImages.push({
        destination,
        file,
        error: 'Upload failed',
      });
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS));
  }

  return uploaded;
}

async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('  PEXELS → SUPABASE UPLOAD');
  console.log('='.repeat(60));
  console.log('');

  // Check env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  // Ensure bucket exists
  const bucketReady = await ensureBucketExists();
  if (!bucketReady) {
    console.error('Failed to setup storage bucket');
    process.exit(1);
  }

  // Load progress
  const progress = loadProgress();
  console.log(`Resuming from: ${progress.completedDestinations.length} destinations completed`);
  console.log(`Images uploaded so far: ${progress.uploadedImages}`);
  console.log('');

  // Get all destination folders
  const destinations = fs.readdirSync(CONFIG.IMAGES_DIR)
    .filter(d => fs.statSync(path.join(CONFIG.IMAGES_DIR, d)).isDirectory());

  const remaining = destinations.filter(d => !progress.completedDestinations.includes(d));

  console.log(`Destinations to process: ${remaining.length}/${destinations.length}`);
  console.log('');

  let count = 0;
  for (const destination of remaining) {
    count++;
    process.stdout.write(`[${count}/${remaining.length}] ${destination}...`);

    try {
      const uploaded = await processDestination(destination, progress);
      console.log(` ${uploaded} images uploaded`);

      progress.completedDestinations.push(destination);
      saveProgress(progress);
    } catch (error) {
      console.log(` ERROR: ${error}`);
      saveProgress(progress);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('  UPLOAD COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Total images uploaded: ${progress.uploadedImages}`);
  console.log(`Failed uploads: ${progress.failedImages.length}`);
  console.log('');
}

main().catch(console.error);
