import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import fs from "fs";

async function updateDisplayPicture() {
  const imagePathEvening = "./evening.jpg";
  const imagePathMorning = "./morning.png";
  const imagePathNight = "./night.jpg";

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

  // 1. Verify the local image file exists
  if (!fs.existsSync(imagePath)) {
    console.error(
      `Error: Image file not found at "${imagePath}". Please add it first.`,
    );
    return;
  }

  // 2. Load authentication state
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  // 3. Initialize connection
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  // 4. Handle connection updates
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("Scan this QR code with your phone to log in:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log("Connection closed, trying to reconnect...");
        updateDisplayPicture();
      } else {
        console.log(
          'Logged out. Delete the "auth_info_baileys" folder and run again.',
        );
      }
    }

    // 5. Trigger the picture update once the connection is open
    else if (connection === "open") {
      console.log("Connected to WhatsApp! Preparing to upload picture...");

      try {
        // Get your own authenticated User JID dynamically
        const myJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";

        console.log(`Uploading profile picture for: ${myJid}`);

        // Perform the profile picture update
        await sock.updateProfilePicture(myJid, { url: imagePath });

        console.log("Success! Profile picture updated successfully.");
      } catch (error) {
        console.error("Failed to update profile picture:", error);
      } finally {
        // Terminate connection cleanly and exit the process
        sock.logout();
        process.exit(0);
      }
    }
  });
}

updateDisplayPicture();
