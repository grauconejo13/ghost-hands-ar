import test from "node:test";
import assert from "node:assert/strict";
import { LessonController } from "../src/core/LessonController.ts";
import { ConsoleScene } from "../src/adapters/ConsoleScene.ts";
import { connectLessonScene } from "../src/adapters/SceneBridge.ts";

test("connect initializes the scene at prepare step", () => {
  const controller = new LessonController();
  const scene = new ConsoleScene();
  connectLessonScene(controller, scene);
  assert.deepEqual([...scene.visible], ["breadboard"]);
  assert.deepEqual([...scene.highlighted], ["breadboard"]);
  assert.deepEqual(scene.progress, { current: 1, total: 5 });
  assert.equal(scene.canGoBack, false);
});

test("next refreshes component visibility and highlight", () => {
  const controller = new LessonController();
  const scene = new ConsoleScene();
  connectLessonScene(controller, scene);
  controller.next();
  assert.deepEqual([...scene.visible], ["breadboard", "led"]);
  assert.deepEqual([...scene.highlighted], ["led"]);
  assert.equal(scene.canGoBack, true);
});

test("complete and back toggle simulated completion effects", () => {
  const controller = new LessonController();
  const scene = new ConsoleScene();
  connectLessonScene(controller, scene);
  while (controller.next()) {}
  assert.equal(scene.virtualLedLit, true);
  assert.equal(scene.connectionPathVisible, true);
  assert.equal(scene.canGoNext, false);
  controller.back();
  assert.equal(scene.virtualLedLit, false);
  assert.deepEqual([...scene.highlighted], ["wires"]);
});

test("disconnect stops rendering changes", () => {
  const controller = new LessonController();
  const scene = new ConsoleScene();
  const disconnect = connectLessonScene(controller, scene);
  disconnect();
  controller.next();
  assert.equal(scene.progress.current, 1);
});
