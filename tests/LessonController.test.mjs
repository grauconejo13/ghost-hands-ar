import test from "node:test";
import assert from "node:assert/strict";
import { LessonController } from "../src/core/LessonController.ts";
import { LED_LESSON } from "../src/core/LessonData.ts";

test("starts on Prepare and exposes correct navigation flags", () => {
  const lesson = new LessonController();
  assert.equal(lesson.getSnapshot().step.id, "prepare");
  assert.equal(lesson.getSnapshot().total, 5);
  assert.equal(lesson.getSnapshot().canGoBack, false);
  assert.equal(lesson.getSnapshot().canGoNext, true);
});

test("moves across all five steps and does not exceed the last step", () => {
  const lesson = new LessonController();
  for (let i = 1; i < LED_LESSON.length; i++) assert.equal(lesson.next(), true);
  assert.equal(lesson.getSnapshot().step.id, "complete");
  assert.equal(lesson.getSnapshot().isComplete, true);
  assert.equal(lesson.next(), false);
  assert.equal(lesson.getSnapshot().index, 4);
});

test("back does not go below zero; restart restores initial state", () => {
  const lesson = new LessonController();
  assert.equal(lesson.back(), false);
  lesson.next();
  lesson.next();
  assert.equal(lesson.back(), true);
  assert.equal(lesson.getSnapshot().step.id, "led");
  assert.equal(lesson.restart(), true);
  assert.equal(lesson.getSnapshot().step.id, "prepare");
  assert.equal(lesson.restart(), false);
});

test("subscriber receives initial snapshot and only changed states", () => {
  const lesson = new LessonController();
  const received = [];
  const unsubscribe = lesson.subscribe(({ step }) => received.push(step.id));
  lesson.back();
  lesson.next();
  unsubscribe();
  lesson.next();
  assert.deepEqual(received, ["prepare", "led"]);
});

test("completion means virtual simulation, not physical verification", () => {
  const lesson = new LessonController();
  while (lesson.next()) { /* advance through the guided lesson */ }
  const { step } = lesson.getSnapshot();
  assert.equal(step.visuals.virtualLedLit, true);
  assert.match(step.hint, /not been verified/i);
});

test("rejects empty lessons and duplicate step ids", () => {
  assert.throws(() => new LessonController([]), /at least one/);
  assert.throws(() => new LessonController([LED_LESSON[0], LED_LESSON[0]]), /unique/);
});
