const { MongoClient } = require('mongodb');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const URI = 'mongodb://mongoapp:huMONGOu5@localhost:27017/clinical_trials?authSource=clinical_trials';
const DB_NAME = 'clinical_trials';
const COLLECTION = 'studies';

function loadCitiesMap(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true });
  const map = {};
  for (const row of records) {
    const key = `${row.CITY.toLowerCase()}|${row.STATE_NAME.toLowerCase()}`;
    map[key] = { lat: parseFloat(row.LATITUDE), lng: parseFloat(row.LONGITUDE) };
  }
  console.log(`Loaded ${Object.keys(map).length} US cities into lookup map`);
  return map;
}

function parseFirstUSLocation(locationsStr) {
  if (!locationsStr) return null;
  const first = locationsStr.split('|')[0].trim();

  if (!first.includes('United States')) return null;

  const parts = first.split(',').map(s => s.trim());
  if (parts.length < 4) return null;

  const state = parts[parts.length - 3].toLowerCase();
  const city  = parts[parts.length - 4].toLowerCase();

  return { city, state, raw: first };
}

async function main() {
  const citiesMap = loadCitiesMap('./uscities.csv');

  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION);

  const total = await col.countDocuments({ location_geo: { $exists: false } });
  console.log(`Documents to process: ${total}`);

  const cursor = col.find({ location_geo: { $exists: false } });

  let count = 0;
  let matched = 0;
  let skipped = 0;
  const bulkOps = [];

  for await (const doc of cursor) {
    count++;
    const loc = parseFirstUSLocation(doc.Locations);

    if (!loc) {
      skipped++;
      continue;
    }

    const key = `${loc.city}|${loc.state}`;
    const coords = citiesMap[key];

    if (coords) {
      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              location_geo: {
                type: 'Point',
                coordinates: [coords.lng, coords.lat]
              },
              location_label: loc.raw
            }
          }
        }
      });
      matched++;
    } else {
      skipped++;
    }

    if (bulkOps.length === 1000) {
      await col.bulkWrite(bulkOps);
      bulkOps.length = 0;
      console.log(`Progress: ${count}/${total} processed, ${matched} geocoded`);
    }
  }

  if (bulkOps.length > 0) {
    await col.bulkWrite(bulkOps);
  }

  console.log('Creating 2dsphere index...');
  await col.createIndex({ location_geo: '2dsphere' });

  console.log('\n=== DONE ===');
  console.log(`Total processed : ${count}`);
  console.log(`Geocoded        : ${matched}`);
  console.log(`Skipped (non-US or no match): ${skipped}`);
  console.log('2dsphere index created on location_geo');

  await client.close();
}

main().catch(console.error);