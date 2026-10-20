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

For an existing GitHub install, fetch the correction:

```sh
paseo plugin update paseo-omp-screenshots
```

For local development:

```sh
npm install
npm run typecheck
npm test
paseo plugin install /absolute/path/to/paseo-omp-screenshots
```

Plugins must already be enabled in Paseo settings. They are trusted, unsandboxed code. This plugin reads only hash-addressed image files, not caller-supplied filesystem paths. It does not start an HTTP server or upload images externally.

Existing screenshot tool results render when their history is loaded. No agent rerun is needed. The plugin accepts embedded base64 images and OMP blob references. Embedded images render directly; blob references load from `~/.omp/agent/blobs` on the daemon host. Click a preview to open its dialog; **Show tool output** reveals the original JSON. Override the blob directory using the daemon environment variable `OMP_SCREENSHOTS_BLOB_DIR` if necessary.

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

- Only completed browser-screenshot results with raw base64 image data or `blob:sha256:<64 lowercase hex characters>` are transformed. Other tool rows remain unchanged.
- PNG, JPEG, WebP, and GIF are supported. Embedded image bytes stay on the client; the browser or native image decoder validates them.
- Blob files are limited to 8 MiB. Bytes must match the content hash and an accepted image signature.
- General read-tool images, assistant image messages, and deleted blobs are outside this workaround.
- Blob references use the selected host's existing plugin RPC connection. OMP's blob store must be readable by that host's daemon.
- Native iOS/Android use React Native components but were not device-tested.

## Verification

Verified with the installed Paseo 0.11.4 web bundle connected to the running daemon, not a mock component harness. The original conversation loaded three 2338×1462 screenshot previews. The supplied `d7228d…4052a` blob decoded to a 64,390-byte PNG with the expected SHA-256. Checked the image dialog and compact browser geometry. Exercised the installed RPC for valid, missing, and malformed references.

The base64 correction was checked against the reported conversation, including the exact 2338×1462 PNG. Its preview and dialog decoded at full source dimensions. The compact preview fit a 430 px viewport without horizontal overflow. Four existing blob-based previews still decoded, including `d7228d…4052a`.

`npm test` covers embedded and mixed-format screenshot results, exact blob byte delivery, integrity mismatch, missing blobs, traversal rejection, non-image data, the size boundary, and leaving unsuccessful or unsupported tool results untouched.
