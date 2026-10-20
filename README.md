# Paseo OMP screenshots

Temporary plugin for [Paseo #3244: OMP browser screenshots are omitted from conversations](https://github.com/getpaseo/paseo/issues/3244).

## Feasibility

The public [timeline plugin API](https://paseo.sh/docs/plugins/reference#timeline-items) lets a client transformer replace a `tool_call` with a custom React Native renderer. [Plugin RPC handlers](https://paseo.sh/docs/plugins/reference#add-plugin-specific-backend-behavior) can read local files on the daemon machine.

In Paseo 0.11.4, the OMP mapper preserves unknown/browser tool results, including image content blocks: [`tool-call-detail.ts`](https://github.com/getpaseo/paseo/blob/v0.11.4/packages/server/src/server/agent/providers/omp/tool-call-detail.ts#L415-L420). The [client runtime](https://github.com/getpaseo/paseo/blob/v0.11.4/packages/app/src/plugins/evaluate.ts#L440-L459) exposes React Native, including `Image`. OMP's [blob store](https://github.com/can1357/oh-my-pi/blob/main/packages/coding-agent/src/session/blob-store.ts) stores these references as extensionless SHA-256 filenames. The plugin combines those existing capabilities; no upstream patch is required.

Related open reports: [#7011: Pi read images missing from the timeline](https://github.com/getpaseo/paseo/issues/7011), [#4556: images sent through agents.send missing from the timeline](https://github.com/getpaseo/paseo/issues/4556). These are not all the same failure. This plugin only handles browser screenshot outputs whose image blocks are preserved.

## Install

Requires Paseo daemon and client 0.11.4, Node/npm for development, and Bun for tests. The manifest permits 0.11.4 through 0.11.x; later versions need compatibility verification.

Install directly from GitHub. Paseo compiles the plugin; no dependency installation is needed on the daemon:

```sh
paseo plugin add git:suiramdev/paseo-omp-screenshots
```

For local development:

```sh
npm install
npm run typecheck
npm test
paseo plugin install /absolute/path/to/paseo-omp-screenshots
```

Plugins must already be enabled in Paseo settings. They are trusted, unsandboxed code. This plugin reads only hash-addressed image files, not caller-supplied filesystem paths. It does not start an HTTP server or upload images externally.

Existing screenshot tool results render when their history is loaded. No agent rerun is needed. Click a preview to open its dialog; **Show tool output** reveals the original JSON. The default blob directory is `~/.omp/agent/blobs` on the daemon host. Override it using the daemon environment variable `OMP_SCREENSHOTS_BLOB_DIR` if necessary.

After editing:

```sh
npm run typecheck
npm test
paseo plugin reload paseo-omp-screenshots
```

Remove the workaround when upstream rendering is fixed:

```sh
paseo plugin remove paseo-omp-screenshots
```

Removal leaves source files and OMP blobs intact. The plugin never rewrites conversation history.

## Limits

- Only completed browser-screenshot results containing `blob:sha256:<64 lowercase hex characters>` are transformed. Other tool rows remain unchanged.
- PNG, JPEG, WebP, and GIF, at most 8 MiB per blob. Bytes must match the content hash and an accepted image signature.
- Inline base64 images, general read-tool images, assistant image messages, and deleted blobs are outside this workaround.
- Uses the selected host's existing plugin RPC connection. OMP's blob store must be readable by that host's daemon.
- Native iOS/Android use React Native components but were not device-tested.

## Verification

Verified with the installed Paseo 0.11.4 web bundle connected to the running daemon, not a mock component harness. The original conversation loaded three 2338×1462 screenshot previews. The supplied `d7228d…4052a` blob decoded to a 64,390-byte PNG with the expected SHA-256. Checked the image dialog and compact browser geometry. Exercised the installed RPC for valid, missing, and malformed references.

`npm test` covers exact byte delivery, integrity mismatch, missing blobs, traversal rejection, non-image data, the size boundary, screenshot recognition, and leaving unsuccessful or unsupported tool results untouched.
