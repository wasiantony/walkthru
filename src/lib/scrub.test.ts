import assert from "node:assert/strict";
import { test } from "node:test";
import { scrubPersonalInfo } from "./scrub";

test("removes email addresses", () => {
  assert.equal(scrubPersonalInfo("send it to jane.doe@example.org please"), "send it to [email] please");
});

test("removes phone numbers in common formats", () => {
  assert.equal(scrubPersonalInfo("call back 555-201-4433 now"), "call back [number] now");
  assert.equal(scrubPersonalInfo("number is (604) 555 0142"), "number is [number]");
  assert.equal(scrubPersonalInfo("ring +1 604.555.0142"), "ring [number]");
});

test("removes long numbers like case or card numbers", () => {
  assert.equal(scrubPersonalInfo("case 4481920 wont open"), "case [number] wont open");
});

test("keeps short numbers that are part of the question", () => {
  assert.equal(scrubPersonalInfo("put 2 windows side by side"), "put 2 windows side by side");
  assert.equal(scrubPersonalInfo("windows 11 update"), "windows 11 update");
});

test("removes street addresses", () => {
  assert.equal(scrubPersonalInfo("directions to 42 Elm Street for a visit"), "directions to [address] for a visit");
});

test("removes capitalized names but keeps known words", () => {
  assert.equal(scrubPersonalInfo("how do I text Maria Lopez a photo"), "how do I text [name] a photo");
  assert.equal(scrubPersonalInfo("my Outlook and Teams wont open"), "my Outlook and Teams wont open");
  assert.equal(scrubPersonalInfo("open Settings on my iPhone"), "open Settings on my iPhone");
});

test("removes names after titles, even in lowercase", () => {
  assert.equal(scrubPersonalInfo("email mrs smith the form"), "email [name] the form");
});

test("leaves the first word of a sentence alone", () => {
  assert.equal(scrubPersonalInfo("Printer says offline"), "Printer says offline");
});

test("tidies spacing", () => {
  assert.equal(scrubPersonalInfo("  lock   my   pc "), "lock my pc");
});
