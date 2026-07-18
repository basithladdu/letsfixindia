import fs from 'fs';

const eventsPath = './data/events.json';
const sourcesPath = './data/sources.json';
const voicesPath = './data/voices.json';

let hasErrors = false;

function logError(message) {
  console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
  hasErrors = true;
}

function logSuccess(message) {
  console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
}

try {
  // Load files
  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
  const voices = JSON.parse(fs.readFileSync(voicesPath, 'utf8'));

  logSuccess('Successfully parsed all JSON databases.');

  // Validate Sources
  const sourceKeys = Object.keys(sources);
  logSuccess(`Found ${sourceKeys.length} sources defined.`);
  
  for (const [id, src] of Object.entries(sources)) {
    if (!src.title) logError(`Source "${id}" is missing a title.`);
    if (!src.publisher) logError(`Source "${id}" is missing a publisher.`);
    if (src.status !== undefined && src.status !== 'verified' && src.status !== 'pending') {
      logError(`Source "${id}" has unknown status "${src.status}".`);
    }
  }

  // Validate Events
  const eventIds = new Set();
  events.forEach((event, index) => {
    const loc = `events.json[${index}] (${event.id || 'missing ID'})`;
    
    if (!event.id) {
      logError(`Event at index ${index} is missing an "id".`);
      return;
    }
    
    if (eventIds.has(event.id)) {
      logError(`Duplicate Event ID found: "${event.id}"`);
    }
    eventIds.add(event.id);

    // Check required fields
    const required = ['year', 'date', 'title', 'category', 'actors', 'status', 'severity', 'summary', 'outcome', 'sources'];
    required.forEach(field => {
      if (event[field] === undefined || event[field] === null) {
        logError(`Event "${event.id}" is missing required field "${field}".`);
      }
    });

    if (Array.isArray(event.sources)) {
      event.sources.forEach(srcId => {
        if (!sources[srcId]) {
          logError(`Event "${event.id}" references undefined source ID "${srcId}".`);
        }
      });
    } else {
      logError(`Event "${event.id}" sources is not an array.`);
    }
  });
  logSuccess(`Validated ${events.length} events successfully.`);

  // Validate Voices
  const voiceIds = new Set();
  const validStances = new Set(['spoke-out', 'supported-govt', 'silent', 'ambiguous']);

  voices.forEach((voice, index) => {
    const loc = `voices.json[${index}] (${voice.id || 'missing ID'})`;

    if (!voice.id) {
      logError(`Voice at index ${index} is missing an "id".`);
      return;
    }

    if (voiceIds.has(voice.id)) {
      logError(`Duplicate Voice ID found: "${voice.id}"`);
    }
    voiceIds.add(voice.id);

    const required = ['name', 'field', 'description', 'stances'];
    required.forEach(field => {
      if (voice[field] === undefined || voice[field] === null) {
        logError(`Voice "${voice.id}" is missing required field "${field}".`);
      }
    });

    if (Array.isArray(voice.stances)) {
      voice.stances.forEach((stance, sIndex) => {
        if (!stance.issue) {
          logError(`Voice "${voice.id}" stance at index ${sIndex} is missing an "issue".`);
        }
        if (!validStances.has(stance.position)) {
          logError(`Voice "${voice.id}" stance for "${stance.issue || sIndex}" has invalid position "${stance.position}".`);
        }
        if (Array.isArray(stance.sources)) {
          stance.sources.forEach(srcId => {
            if (!sources[srcId]) {
              logError(`Voice "${voice.id}" stance for "${stance.issue}" references undefined source ID "${srcId}".`);
            }
          });
        } else {
          logError(`Voice "${voice.id}" stance for "${stance.issue}" sources is not an array.`);
        }
      });
    } else {
      logError(`Voice "${voice.id}" stances is not an array.`);
    }
  });
  logSuccess(`Validated ${voices.length} public figures successfully.`);

} catch (err) {
  logError(`Fatal validation parsing error: ${err.message}`);
}

if (hasErrors) {
  console.error('\n\x1b[31m[FAILURE]\x1b[0m Database validation failed.');
  process.exit(1);
} else {
  console.log('\n\x1b[32m[SUCCESS]\x1b[0m Database validation passed successfully.');
  process.exit(0);
}
