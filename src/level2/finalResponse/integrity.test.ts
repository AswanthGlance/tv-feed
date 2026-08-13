import { describe, it, expect } from 'vitest';
import { describeHollowResponse } from './integrity';
import type { FinalTextResponse, FinalSummaryResponse } from '../types/finalResponse';

/* The bug this locks in: a trace whose `<place_card>` wrapper got cut mid-tag
   by output truncation parses down to just a leading prose sentence — e.g.
   "I found some great options for you!" — with nothing else recoverable. The
   agent line still reads as a real find, but the reading surface beneath it
   is empty. That must be rejected as hollow so the scenario registry falls
   back to something with real content, rather than shipping a floating quote
   with no result to a demo. */

const textResponse = (over: Partial<FinalTextResponse> = {}): FinalTextResponse => ({
  kind: 'text',
  headline: 'I found some great options for you!',
  body: [],
  ...over,
});

const summaryResponse = (over: Partial<FinalSummaryResponse> = {}): FinalSummaryResponse => ({
  kind: 'summary',
  headline: 'Here is what keeps coming up',
  takeaways: [],
  ...over,
});

describe('describeHollowResponse — text/summary with a headline and nothing beneath it', () => {
  it('rejects a text response with an empty body and no supporting content', () => {
    expect(describeHollowResponse(textResponse())).toBeDefined();
  });

  it('accepts a text response once body carries real content', () => {
    expect(describeHollowResponse(textResponse({ body: ['A real second sentence with the actual answer.'] }))).toBeUndefined();
  });

  it('accepts a text response with an empty body when supporting content exists', () => {
    expect(
      describeHollowResponse(textResponse({ supporting: [{ role: 'supporting', title: 'Booking tips', lines: ['Book 2 days ahead.'] }] }))
    ).toBeUndefined();
  });

  it('rejects a summary response with no takeaways, themes or supporting content', () => {
    expect(describeHollowResponse(summaryResponse())).toBeDefined();
  });

  it('accepts a summary response once takeaways carry real content', () => {
    expect(describeHollowResponse(summaryResponse({ takeaways: ['Most reviews mention the crowds after 6pm.'] }))).toBeUndefined();
  });
});
