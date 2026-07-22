import fs from 'fs';

const eventsPath = './data/events.json';
const sourcesPath = './data/sources.json';
const voicesPath = './data/voices.json';
const indicatorsPath = './data/indicators.json';
const jurisdictionsPath = './data/event-jurisdictions.json';
const governancePath = './data/state-governance.json';
const boundariesPath = './data/india-states.geojson';

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
  const jurisdictions = JSON.parse(fs.readFileSync(jurisdictionsPath, 'utf8'));
  const governance = JSON.parse(fs.readFileSync(governancePath, 'utf8'));
  const boundaries = JSON.parse(fs.readFileSync(boundariesPath, 'utf8'));

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

  const boundaryNames = new Set((boundaries.features || []).map((feature) => feature?.properties?.name).filter(Boolean));
  const eventStates = jurisdictions?.eventStates;
  if (!eventStates || typeof eventStates !== 'object' || Array.isArray(eventStates)) {
    logError('event-jurisdictions.json must contain an "eventStates" object.');
  } else {
    for (const [eventId, states] of Object.entries(eventStates)) {
      if (!eventIds.has(eventId)) logError(`Jurisdiction index references unknown event "${eventId}".`);
      if (!Array.isArray(states) || states.length === 0) {
        logError(`Jurisdiction index for "${eventId}" must be a non-empty array.`);
        continue;
      }
      for (const state of states) {
        if (!boundaryNames.has(state)) logError(`Jurisdiction index for "${eventId}" references unknown boundary "${state}".`);
      }
    }
    logSuccess(`Validated ${Object.keys(eventStates).length} state-tagged event mappings successfully.`);
  }

  const governanceJurisdictions = governance?.jurisdictions;
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  const termDate = /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/;
  if (!governanceJurisdictions || typeof governanceJurisdictions !== 'object' || Array.isArray(governanceJurisdictions)) {
    logError('state-governance.json must contain a "jurisdictions" object.');
  } else {
    for (const [stateName, record] of Object.entries(governanceJurisdictions)) {
      const label = `State governance record "${stateName}"`;
      if (!boundaryNames.has(stateName)) logError(`${label} does not match a map boundary name.`);
      if (record.kind !== 'state' && record.kind !== 'union territory') logError(`${label} has invalid kind "${record.kind}".`);
      if (!isoDate.test(record.verifiedAsOf || '')) logError(`${label} requires an ISO verifiedAsOf date.`);
      for (const [field, allowMissingLeader] of [['governmentTerms', false], ['oppositionTerms', true]]) {
        const terms = record[field];
        if (!Array.isArray(terms) || terms.length === 0) {
          logError(`${label} requires a non-empty ${field} array.`);
          continue;
        }
        if (terms.filter((term) => term.to === null).length !== 1) {
          logError(`${label} ${field} must contain exactly one current term with to: null.`);
        }
        if (terms[0]?.from > '2014-12-31') {
          logError(`${label} ${field} does not cover the start of the 2014-present period.`);
        }
        terms.forEach((term, index) => {
          const termLabel = `${label} ${field}[${index}]`;
          if (!termDate.test(term.from || '')) logError(`${termLabel} requires a YYYY, YYYY-MM, or YYYY-MM-DD from value.`);
          if (term.to !== null && !termDate.test(term.to || '')) logError(`${termLabel} to must be YYYY, YYYY-MM, YYYY-MM-DD, or null.`);
          if (term.to && term.from && term.to < term.from) logError(`${termLabel} ends before it begins.`);
          if (!term.office) logError(`${termLabel} is missing office.`);
          if (!allowMissingLeader && !term.leader) logError(`${termLabel} is missing leader.`);
          if (allowMissingLeader && !term.leader && !term.status) logError(`${termLabel} requires a leader or an explicit opposition status.`);
          if (!term.basis) logError(`${termLabel} is missing basis.`);
          if (!Array.isArray(term.sources) || term.sources.length === 0) {
            logError(`${termLabel} requires at least one source.`);
          } else {
            term.sources.forEach((sourceId) => {
              if (!sources[sourceId]) logError(`${termLabel} references undefined source ID "${sourceId}".`);
              else if (!sources[sourceId].url) logError(`${termLabel} source "${sourceId}" has no URL.`);
            });
          }
        });
      }
    }
    logSuccess(`Validated ${Object.keys(governanceJurisdictions).length} state government and opposition records successfully.`);
  }

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
