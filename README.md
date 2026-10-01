> This repository is public only because GitHub provides unlimited GitHub Actions runner usage for public repositories.

# wa-baileys-pfp

A small project for working with WhatsApp profile pictures using the Baileys library.

This repository is meant to make it easier to interact with WhatsApp profile images in a simple, scriptable way. Instead of manually dealing with the lower-level client connection and media code, the project wraps the core Baileys behavior into a straightforward flow for reading, storing, and updating profile pictures.

## What this project does

The main goal is to provide a minimal but practical setup for:

- connecting to WhatsApp through Baileys
- authenticating with a session
- fetching profile pictures for contacts or the current user
- saving or transforming those images locally
- optionally updating a profile image through the WhatsApp client

This is useful for automation, small bots, or testing scenarios where profile image handling must be integrated into a larger app or service.

## Typical setup

The project is intended to be run as a Node.js application using the Baileys library.

### Prerequisites

- Node.js 18+ recommended
- npm or another package manager
- a WhatsApp account that can be logged in through the Baileys client

### Install dependencies

```bash
npm install
```

### Run the app

```bash
npm start
```

Depending on the implementation, the app may start a Baileys client, generate a QR code for login, and then wait for the session to become active before profile operations are available.

## Suggested architecture

The project is intentionally lightweight, but its architecture is still organized around a few clear responsibilities:

- Client layer: manages the Baileys connection and authentication session
- Session layer: stores connection state so the app can reconnect without re-authentication each time
- Profile service: handles fetching and processing WhatsApp profile pictures
- File/storage layer: stores downloaded images or cached versions on disk
- App entrypoint: boots the client, wires the services together, and exposes the available actions

In other words, the client is the connection to WhatsApp, while the service layer contains the actual logic for profile-picture operations. This keeps the project easy to understand and makes it simple to extend with additional WhatsApp media features later.

## Example workflow

A common flow in this project looks like this:

1. Start the Baileys client
2. Authenticate with QR code or stored session
3. Wait for the client to be ready
4. Request the current user or target contact profile picture
5. Download or transform the image
6. Save it locally or send it to another part of the system

This pattern is useful because it separates connection management from image processing. The client handles WhatsApp events and session management, while the profile logic focuses on one narrow task.

## Why this design works

This project keeps the structure intentionally small so it is easy to study and modify. The design is built around:

- a single WhatsApp connection
- minimal service boundaries
- local file-based handling for images
- straightforward startup and authentication flow

That makes the project a good starting point for more advanced WhatsApp automation without forcing a heavy framework or a complex application structure.

## Notes

This repository is designed as a small, focused utility rather than a full production framework. It is best suited for learning, experimentation, and lightweight automation around WhatsApp profile images.
