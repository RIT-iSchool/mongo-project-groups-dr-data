const { MongoClient, GridFSBucket } = require('mongodb');
const axios = require('axios');
const { Readable } = require('stream');

const URI = 'mongodb://mongoapp:huMONGOu5@localhost:27017/clinical_trials?authSource=clinical_trials';
const DB_NAME = 'clinical_trials';
const COLLECTION = 'studies';

// Maps condition keywords to a relevant Wikimedia Commons image filename.
// The first matching entry wins, so order matters (more specific first).
const CONDITION_IMAGE_MAP = [
  { keywords: ['cancer', 'tumor', 'carcinoma', 'oncol', 'lymphoma', 'leukemia', 'melanoma', 'neoplasm'],
    file: 'Cancer_cells.jpg' },
  { keywords: ['diabetes', 'insulin', 'glucose', 'glycem'],
    file: 'Blue_circle_for_diabetes.svg' },
  { keywords: ['heart', 'cardiac', 'coronary', 'myocardial', 'cardiovascular', 'atrial'],
    file: 'Diagram_of_the_human_heart.svg' },
  { keywords: ['alzheimer', 'dementia', 'cognitive', 'neurodegen'],
    file: 'Alzheimer%27s_disease_brain_comparison.jpg' },
  { keywords: ['asthma', 'pulmonar', 'respiratory', 'copd', 'bronch'],
    file: 'Asthma_attack-illustration_NIH.jpg' },
  { keywords: ['depression', 'anxiety', 'mental', 'psychiatr', 'schizophr', 'bipolar'],
    file: 'Depression.jpg' },
  { keywords: ['stroke', 'parkinson', 'epileps', 'multiple sclerosis', 'neuro'],
    file: 'Human_brain_NIH.jpg' },
  { keywords: ['hiv', 'aids', 'hepatitis', 'infection', 'viral'],
    file: 'HIV-budding-Color.jpg' },
  { keywords: ['arthritis', 'rheumat', 'lupus', 'autoimmune'],
    file: 'Rheumatoid_arthritis.jpg' },
  { keywords: ['obesity', 'weight', 'bmi', 'metabolic'],
    file: 'Body_mass_index_chart.svg' },
  { keywords: ['sleep', 'insomnia', 'apnea'],
    file: 'Sleep_Hypnogram.svg' },
  { keywords: ['pain', 'opioid', 'analges'],
    file: '1506_Referred_Pain_Chart.jpg' },
];

// Fallback image used when no condition keyword matches
const DEFAULT_IMAGE = 'Caduceus.svg';

// Looks up the best matching image filename for a study's Conditions field.
// Returns the default medical symbol if nothing matches.
function pickImageFile(conditions) {
  if (!conditions) return DEFAULT_IMAGE;
  const lower = conditions.toLowerCase();
  for (const entry of CONDITION_IMAGE_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.file;
    }
  }
  return DEFAULT_IMAGE;
}

// Downloads an image from Wikimedia Commons by filename.
// Uses the Special:FilePath redirect which resolves to the actual image URL.
async function downloadWikimediaImage(filename) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 15000,
    headers: { 'User-Agent': 'RIT-ClinicalTrials-Project/1.0' }
  });
  return Buffer.from(res.data);
}

// Simple sleep helper used to avoid hitting Wikimedia rate limits
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION);


  // custom bucket name 'images' to keep it separate from default fs.files
  const bucket = new GridFSBucket(db, { bucketName: 'images' });

  // Cache maps filename -> GridFS ObjectId so we only download each image once
  const fileIdCache = {};
  const allFiles = [...new Set(CONDITION_IMAGE_MAP.map(e => e.file)), DEFAULT_IMAGE];

  console.log('=== Downloading and storing images in GridFS ===');

  for (const filename of allFiles) {
    // If this image was already uploaded in a previous run, reuse it
    const existing = await bucket.find({ filename: filename }).toArray();
    if (existing.length > 0) {
      fileIdCache[filename] = existing[0]._id;
      console.log(` Already in GridFS: ${filename}`);
      continue;
    }

    try {
      console.log(` Downloading: ${filename}`);
      const buffer = await downloadWikimediaImage(filename);

      // Convert buffer to readable stream to pipe into GridFS
      const readable = Readable.from(buffer);
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: { source: 'wikimedia', originalFile: filename }
      });

      readable.pipe(uploadStream);

      // Wait for upload to complete before moving to next image
      await new Promise((res, rej) => {
        uploadStream.on('finish', res);
        uploadStream.on('error', rej);
      });

      fileIdCache[filename] = uploadStream.id;
      console.log(` Stored: ${filename} (GridFS id: ${uploadStream.id})`);

      // Wait 2 seconds between downloads for Wikimedia rate limits
      await sleep(2000);
    } catch (err) {
      console.log(` Failed: ${filename} — ${err.message}`);
    }
  }

  console.log('\n=== Linking images to documents ===');
  const total = await col.countDocuments({});
  console.log(`Total documents to link: ${total}`);

  let count = 0;
  const bulkOps = [];
  const cursor = col.find({});

  for await (const doc of cursor) {
    count++;

    // Pick the right image for this study based on its Conditions field
    const filename = pickImageFile(doc.Conditions);
    const fileId = fileIdCache[filename] || fileIdCache[DEFAULT_IMAGE];

    if (fileId) {
      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              // Store GridFS file id so the backend can retrieve the image later
              image_file_id: fileId,
              image_filename: filename
            }
          }
        }
      });
    }

    // Write in batches of 1000 for performance
    if (bulkOps.length === 1000) {
      await col.bulkWrite(bulkOps);
      bulkOps.length = 0;
      console.log(`  Progress: ${count}/${total} linked`);
    }
  }

  // Write any remaining documents that didn't fill a full batch
  if (bulkOps.length > 0) {
    await col.bulkWrite(bulkOps);
  }

  console.log('\n=== DONE ===');
  console.log(`Total documents linked: ${count}`);
  console.log(`GridFS images stored  : ${Object.keys(fileIdCache).length}`);
  await client.close();
}

main().catch(console.error);