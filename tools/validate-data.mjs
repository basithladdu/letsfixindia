import fs from 'fs';

const eventsPath = './data/events.json';
const sourcesPath = './data/sources.json';
const voicesPath = './data/voices.json';
const indicatorsPath = './data/indicators.json';
const mediaGroupsPath = './data/media-groups.json';
const mediaOutletsPath = './data/media-outlets.json';
const mediaPeoplePath = './data/media-people.json';
const mediaConnectionsPath = './data/media-connections.json';

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
  const indicators = JSON.parse(fs.readFileSync(indicatorsPath, 'utf8'));
  const mediaGroups = JSON.parse(fs.readFileSync(mediaGroupsPath, 'utf8'));
  const mediaOutlets = JSON.parse(fs.readFileSync(mediaOutletsPath, 'utf8'));
  const mediaPeople = JSON.parse(fs.readFileSync(mediaPeoplePath, 'utf8'));
  const mediaConnections = JSON.parse(fs.readFileSync(mediaConnectionsPath, 'utf8'));

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

  const validateIdList = (items, label, required, extra = () => {}) => {
    const ids = new Set();
    if (!Array.isArray(items)) return logError(`${label} must contain an array.`);
    items.forEach((item, index) => {
      if (!item.id || typeof item.id !== 'string') return logError(`${label}[${index}] is missing an id.`);
      if (ids.has(item.id)) logError(`Duplicate ${label} id: "${item.id}".`);
      ids.add(item.id);
      required.forEach((field) => { if (item[field] === undefined || item[field] === null || item[field] === '') logError(`${label} "${item.id}" is missing ${field}.`); });
      if (!Array.isArray(item.sourceIds) || !item.sourceIds.length) logError(`${label} "${item.id}" needs at least one sourceId.`);
      else item.sourceIds.forEach((id) => { if (!sources[id] || sources[id].status === 'pending') logError(`${label} "${item.id}" references a missing or pending source "${id}".`); });
      extra(item);
    });
    return ids;
  };
  const groupIds = validateIdList(mediaGroups, 'media group', ['name', 'ownership', 'lastVerified'], (item) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.lastVerified)) logError(`Media group "${item.id}" lastVerified must be YYYY-MM-DD.`);
    (item.controllerIds || []).forEach((id) => { if (!mediaPeople.some((person) => person.id === id)) logError(`Media group "${item.id}" references unknown person "${id}".`); });
  });
  validateIdList(mediaPeople, 'media person', ['name', 'role']);
  validateIdList(mediaOutlets, 'media outlet', ['name', 'type', 'groupId', 'languages'], (item) => { if (!groupIds.has(item.groupId)) logError(`Media outlet "${item.id}" references unknown group "${item.groupId}".`); });
  const connectionTypes = new Set(['elected-office', 'party-membership', 'party-position', 'election-candidacy', 'political-donation', 'political-ownership', 'government-control']);
  validateIdList(mediaConnections, 'media connection', ['subjectId', 'subjectType', 'connectionType', 'description'], (item) => {
    if (!connectionTypes.has(item.connectionType)) logError(`Media connection "${item.id}" has invalid connectionType.`);
    if (item.subjectType === 'group' && !groupIds.has(item.subjectId)) logError(`Media connection "${item.id}" has unknown group subject.`);
    if (item.subjectType === 'person' && !mediaPeople.some((person) => person.id === item.subjectId)) logError(`Media connection "${item.id}" has unknown person subject.`);
  });
  logSuccess(`Validated ${mediaGroups.length} media groups and ${mediaOutlets.length} media outlets successfully.`);

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

  // Validate statistics cards and their chart points.
  if (!Array.isArray(indicators)) {
    logError('indicators.json must contain an array.');
  } else {
    indicators.forEach((indicator, index) => {
      const label = `Indicator at index ${index}`;
      ['title', 'value', 'detail', 'direction'].forEach((field) => {
        if (typeof indicator[field] !== 'string' || !indicator[field].trim()) {
          logError(`${label} is missing a non-empty "${field}".`);
        }
      });

      if (!Array.isArray(indicator.sources) || indicator.sources.length === 0) {
        logError(`${label} sources must be a non-empty array.`);
      } else {
        indicator.sources.forEach((srcId) => {
          if (!sources[srcId]) {
            logError(`${label} references undefined source ID "${srcId}".`);
          }
        });
      }

      if (!Array.isArray(indicator.chart) || indicator.chart.length === 0) {
        logError(`${label} chart must be a non-empty array.`);
      } else {
        indicator.chart.forEach((point, pointIndex) => {
          if (typeof point.label !== 'string' || !point.label.trim()) {
            logError(`${label} chart point ${pointIndex} is missing a label.`);
          }
          if (typeof point.value !== 'number' || !Number.isFinite(point.value)) {
            logError(`${label} chart point ${pointIndex} must have a finite numeric value.`);
          }
        });
      }
    });
    logSuccess(`Validated ${indicators.length} statistics successfully.`);
  }

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
