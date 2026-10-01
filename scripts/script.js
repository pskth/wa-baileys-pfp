import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pino from "pino";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isShuttingDown = false;
const sessionDir = "auth_info_baileys";

async function updateDisplayPicture() {
  const imagePathEvening = path.join(__dirname, "../images/evening.jpg");
  const imagePathMorning = path.join(__dirname, "../images/morning.png");
  const imagePathNight = path.join(__dirname, "../images/night.png");

  const now = new Date();
  const hours = now.getHours();

  let imagePath = null;
  if (hours < 8 && hours > 4) {
    imagePath = imagePathMorning;
  } else if (hours < 19 && hours > 8) {
    imagePath = imagePathEvening;
  } else {
    imagePath = imagePathNight;
  }

  if (!fs.existsSync(imagePath)) {
    console.error(
      `Error: Image file not found at "${imagePath}". Please add it first.`,
    );
    return;
  }

  if (process.env.WHATSAPP_SESSION) {
    console.log(
      "Found WhatsApp session secret. Reconstructing authentication files...",
    );
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    const decryptedCreds = Buffer.from(
      process.env.WHATSAPP_SESSION,
      "base64",
    ).toString("utf-8");
    fs.writeFileSync(path.join(sessionDir, "creds.json"), decryptedCreds);
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    browser: Browsers.ubuntu("Chrome"),
    shouldSyncHistoryMessage: () => false,
    getMessage: async () => undefined,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("Scan this QR code with your phone to log in:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      if (isShuttingDown) {
        console.log("Socket closed successfully. Cleaning up folder...");
        if (fs.existsSync(sessionDir)) {
          fs.rmSync(sessionDir, { recursive: true, force: true });
          // console.log(`Cleaned up temporary directory: "${sessionDir}"`);
        }
        process.exit(0);
      }

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("Connection closed unexpectedly, trying to reconnect...");
        updateDisplayPicture();
      } else {
        console.log("Logged out. Please re-authenticate your session.");
      }
    } else if (connection === "open") {
      console.log("Connected to WhatsApp! Preparing to upload picture...");

      try {
        const myJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        console.log(
          "Uploading profile picture for your authenticated account...",
        );

        await sock.updateProfilePicture(myJid, { url: imagePath });
        console.log("Success! Profile picture updated successfully.");
      } catch (error) {
        console.error("Failed to update profile picture:", error);
      } finally {
        console.log("Disconnecting gracefully...");
        isShuttingDown = true;
        sock.end(undefined);
      }
    }
  });
}

updateDisplayPicture();
