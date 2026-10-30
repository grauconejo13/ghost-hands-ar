# Ghost Hands Learning Modules v0.1

This is the **portable learning-pack foundation**, separate from the five-step electronics lesson. An initial AWS S3 Basics pack lives in `public/modules/aws-s3-basics.json`.

## Module format
A JSON manifest with `schemaVersion`, slug `id`, `title`, `summary`, `category`, `requiresInternet`, and an ordered array of `steps` containing `id`, `title`, `instruction`, and `checkpoint`. It contains **no JavaScript**, credentials, or executable commands.

`ModuleCatalog` validates, registers, lists, and removes modules. `ModuleProgress` navigates a single lesson in memory. Five tests cover validation and navigation.

## How this helps our AR vision
The same pack can eventually drive a browser or Lens Studio instructional card. A future AI assistant may compare the visible scene with the current checkpoint, but **a module alone does not analyze images** or verify actions.

## Status and limitations
- JSON format, validation, progress model, sample pack, and tests are implemented.
- **Not yet implemented:** download/install UI, persistent caching, offline file storage, dynamic AI checkpoints, or a SPECS adapter.
- The AWS pack needs an internet connection to use the actual AWS console. The instructional JSON itself can be distributed without a live AI service.
- Do not treat the sample as a claim that an AWS account, permissions, costs, or infrastructure configuration has been verified.
