# OMP screenshots

Shows Oh My Pi browser screenshots inline in the Paseo conversation instead of leaving their image blocks in raw tool-output JSON. Select a preview to open it in a dialog. The original output remains available under **Show tool output**.

Requires Paseo 0.11.4 for both the daemon and client. Compatibility is bounded below 0.12.0 until that release is checked. This is a temporary workaround for [Paseo #3244](https://github.com/getpaseo/paseo/issues/3244), not a patch to Paseo or OMP.

The plugin accepts raw base64 images and `blob:sha256:…` references from completed browser-screenshot tool results. Embedded images render directly on the client. For blob references, the backend reads the corresponding extensionless file from `~/.omp/agent/blobs`, checks its SHA-256 and image signature, and sends the image through the existing Paseo plugin RPC connection. No public image server or external upload is used.

If OMP uses a different blob directory, set `OMP_SCREENSHOTS_BLOB_DIR` in the daemon environment to that directory. The default is relative to the daemon user's home, not the client's home. OMP and the plugin must have access to the same store.

PNG, JPEG, WebP, and GIF are supported. Blob files may be up to 8 MiB. Missing or invalid images show an error with a retry action. Images discarded by Paseo's read-tool mapper are outside this workaround. Deleting a blob removes the ability to load its preview in a fresh client session.

The interface uses React Native components. Desktop and compact browser layouts were checked against the installed Paseo web bundle; native iOS and Android were not device-tested.
