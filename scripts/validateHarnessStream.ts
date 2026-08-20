/* Node-only validation script for PASS 1 / PASS 2 of the harness-stream
 * integration (see the approved plan). Reads the captured qNN_events.json
 * files, runs them through buildScenarioFromHarnessStream, and reports
 * per-file: event count, real classification result, entity count, final
 * response kind, and any rejection reason. Never a "does it look right"
 * check — every number printed is read straight off the real pipeline.
 *
 * Run: npx tsx scripts/validateHarnessStream.ts
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScenarioFromHarnessStream } from '../src/level2/harnessStream/buildScenarioFromHarnessStream';
import type { HarnessStreamEvent, HarnessTurnEventSource } from '../src/level2/harnessStream/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, 'fixtures/harness-stream');

function loadManifest(): Record<string, string> {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, 'manifest.json'), 'utf-8'));
}

function loadTurn(id: string, prompt: string): HarnessTurnEventSource {
  const events: HarnessStreamEvent[] = JSON.parse(readFileSync(join(FIXTURE_DIR, `${id}_events.json`), 'utf-8'));
  return { turnId: id, prompt, events };
}

function main() {
  const manifest = loadManifest();
  const files = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('_events.json'));
  const ids = files.map((f) => f.replace('_events.json', '')).sort();

  console.log(`\nFound ${ids.length} captured turns: ${ids.join(', ')}\n`);
  console.log('='.repeat(100));

  let ok = 0;
  let rejected = 0;

  for (const id of ids) {
    const prompt = manifest[id];
    if (!prompt) {
      console.log(`\n[${id}] SKIPPED — no manifest entry for prompt`);
      continue;
    }
    const turn = loadTurn(id, prompt);
    console.log(`\n[${id}] "${prompt.slice(0, 90)}${prompt.length > 90 ? '…' : ''}"`);
    console.log(`  raw events: ${turn.events.length}`);

    let result: ReturnType<typeof buildScenarioFromHarnessStream>;
    try {
      result = buildScenarioFromHarnessStream(turn);
    } catch (e) {
      rejected += 1;
      console.log(`  ❌ THREW: ${(e as Error).message}`);
      console.log((e as Error).stack?.split('\n').slice(0, 5).join('\n'));
      continue;
    }

    if (!result.scenario) {
      rejected += 1;
      console.log(`  ❌ REJECTED: ${result.rejectedReason}`);
      console.log(`  semantic events: ${result.diagnostics.eventCount}, internal: ${result.diagnostics.internalEventCount}`);
      if (result.diagnostics.unrecognizedTools.length) console.log(`  unrecognized tools: ${result.diagnostics.unrecognizedTools.join(', ')}`);
      continue;
    }

    ok += 1;
    const s = result.scenario;
    console.log(`  ✅ archetype: ${s.archetype}  (confidence: ${s.classification?.confidence}, source: ${s.source})`);
    console.log(`  signals: ${s.classification?.signals.join(' | ')}`);
    console.log(`  hasImages: ${s.classification?.hasImages}  hasMapSignals: ${s.classification?.hasMapSignals}  hasStructuredData: ${s.classification?.hasStructuredData}`);
    console.log(`  semantic events: ${result.diagnostics.eventCount}  internal: ${result.diagnostics.internalEventCount}  noRealTimingFound: ${result.diagnostics.noRealTimingFound}`);
    console.log(`  entities: ${s.metadata?.entityCount}  supporting: ${s.metadata?.supportingCount}`);
    console.log(`  thinking passes: ${s.thinkingPasses.length}  [${s.thinkingPasses.map((p) => p.valueType ?? p.visibility).join(', ')}]`);
    console.log(`  final response kind: ${s.finalResponse.kind}`);
    if (s.finalResponse.kind === 'entity_rail') console.log(`    winnerId: ${s.finalResponse.winnerId ?? '(none)'}  entities: ${s.finalResponse.entities.length}`);
    if (s.finalResponse.kind === 'list') console.log(`    items: ${s.finalResponse.items.length}`);
    if (s.finalResponse.kind === 'entity') console.log(`    entity: ${s.finalResponse.entity.title}`);
    if (s.finalResponse.kind === 'text') console.log(`    headline: ${s.finalResponse.headline}`);
    const invariantWarnings = s.metadata?.invariantWarnings as Array<{ message: string }> | undefined;
    if (invariantWarnings?.length) console.log(`  ⚠ invariant warnings: ${invariantWarnings.map((w) => w.message).join(' | ')}`);
    if (result.diagnostics.unrecognizedTools.length) console.log(`  unrecognized tools: ${result.diagnostics.unrecognizedTools.join(', ')}`);

    // Sanity: real-timing monotonicity — every event's startTime <= endTime,
    // and timeline is non-negative.
    const badTiming: string[] = [];
    for (const p of s.thinkingPasses) {
      if (p.traceTiming && p.traceTiming.start > p.traceTiming.end) badTiming.push(p.id);
    }
    if (badTiming.length) console.log(`  ❌ BAD TIMING on passes: ${badTiming.join(', ')}`);
  }

  console.log('\n' + '='.repeat(100));
  console.log(`\n${ok} usable, ${rejected} rejected, out of ${ids.length} captured turns.\n`);
}

main();
