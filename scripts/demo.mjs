import { LessonController } from "../src/core/LessonController.ts";
import { ConsoleScene } from "../src/adapters/ConsoleScene.ts";
import { connectLessonScene } from "../src/adapters/SceneBridge.ts";

const lesson = new LessonController();
const scene = new ConsoleScene();
const disconnect = connectLessonScene(lesson, scene);

console.log("GHOST HANDS: virtual lesson preview (not AR)\n");
console.log(scene.describe());
while (lesson.next()) {
  console.log("\n--- NEXT ---\n");
  console.log(scene.describe());
}
disconnect();
